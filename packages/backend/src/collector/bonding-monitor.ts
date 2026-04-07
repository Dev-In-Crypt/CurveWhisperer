import { EventEmitter } from 'events';
import { BitqueryClient } from '../utils/bitquery.js';
import { CurveStore } from '../state/curve-store.js';
import { TradeEvent } from '../utils/types.js';
import { getTokenInfo } from '../utils/bsc-rpc.js';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('bonding-monitor');

const NEW_TOKENS_SUB = `
subscription {
  EVM(network: bsc) {
    Events(
      where: {
        Transaction: {
          To: { is: "${config.fourMeme.factoryAddress}" }
        }
        Log: { Signature: { Name: { is: "TokenCreate" } } }
      }
    ) {
      Arguments {
        Name
        Type
        Value {
          ... on EVM_ABI_Integer_Value_Arg { integer }
          ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          ... on EVM_ABI_Address_Value_Arg { address }
          ... on EVM_ABI_String_Value_Arg { string }
        }
      }
      Transaction { Hash From }
      Block { Time }
    }
  }
}
`;

const TRADES_SUB = `
subscription {
  EVM(network: bsc) {
    DEXTrades(
      where: {
        Trade: {
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
        }
      }
    ) {
      Block { Time }
      Transaction { Hash From To }
      Trade {
        Buyer
        Seller
        Currency { Symbol Name SmartContract }
        Side { Currency { Symbol Name SmartContract } Amount }
        Amount
        Price
        Dex { ProtocolName PairAddress }
      }
    }
  }
}
`;

export class BondingMonitor extends EventEmitter {
  private bitquery: BitqueryClient;
  private curveStore: CurveStore;
  private seenTxHashes = new Set<string>();
  private maxSeenTxHashes = 1000;

  constructor(bitquery: BitqueryClient, curveStore: CurveStore) {
    super();
    this.bitquery = bitquery;
    this.curveStore = curveStore;
  }

  start(): void {
    log.info('Starting bonding monitor...');

    // Subscribe to new token creation
    this.bitquery.subscribe(
      'new-tokens',
      NEW_TOKENS_SUB,
      undefined,
      (data) => this.handleNewToken(data),
      (err) => log.error({ err: err.message }, 'New tokens subscription error'),
    );

    // Subscribe to trades
    this.bitquery.subscribe(
      'trades',
      TRADES_SUB,
      undefined,
      (data) => this.handleTrade(data),
      (err) => log.error({ err: err.message }, 'Trades subscription error'),
    );

    log.info('Bonding monitor started');
  }

  private async handleNewToken(data: unknown): Promise<void> {
    try {
      const events = (data as any)?.EVM?.Events;
      if (!Array.isArray(events)) return;

      for (const event of events) {
        const args: Record<string, string> = {};
        for (const arg of event.Arguments || []) {
          const val = arg.Value?.address || arg.Value?.string || arg.Value?.bigInteger || arg.Value?.integer;
          if (val !== undefined) args[arg.Name] = String(val);
        }

        const tokenAddress = args['token'];
        if (!tokenAddress) continue;

        let name = args['name'] || 'Unknown';
        let symbol = args['symbol'] || '???';

        // Try fetching from chain if not in event
        if (name === 'Unknown') {
          try {
            const info = await getTokenInfo(tokenAddress);
            name = info.name;
            symbol = info.symbol;
          } catch { /* use defaults */ }
        }

        const timestamp = new Date(event.Block?.Time || Date.now()).getTime();
        this.curveStore.addCurve(tokenAddress, name, symbol, timestamp);
      }
    } catch (err) {
      log.error({ err }, 'Failed to handle new token event');
    }
  }

  private handleTrade(data: unknown): void {
    try {
      const trades = (data as any)?.EVM?.DEXTrades;
      if (!Array.isArray(trades)) return;

      for (const t of trades) {
        const txHash = t.Transaction?.Hash;
        if (!txHash) continue;

        // Dedup
        if (this.seenTxHashes.has(txHash)) continue;
        this.seenTxHashes.add(txHash);
        if (this.seenTxHashes.size > this.maxSeenTxHashes) {
          const iter = this.seenTxHashes.values();
          for (let i = 0; i < 200; i++) iter.next();
          // Trim oldest entries
          const keep = new Set<string>();
          for (const v of this.seenTxHashes) {
            if (keep.size >= this.maxSeenTxHashes - 200) break;
            keep.add(v);
          }
          this.seenTxHashes = keep;
        }

        const tokenAddress = t.Trade?.Currency?.SmartContract;
        if (!tokenAddress) continue;

        const bnbAmount = parseFloat(t.Trade?.Side?.Amount || '0');
        const tokenAmount = parseFloat(t.Trade?.Amount || '0');
        if (bnbAmount === 0) continue;

        const buyer = t.Trade?.Buyer || t.Transaction?.From || '';
        const isBuy = buyer.toLowerCase() !== config.fourMeme.factoryAddress.toLowerCase();

        const trade: TradeEvent = {
          tokenAddress,
          buyer,
          bnbAmount,
          tokenAmount,
          direction: isBuy ? 'buy' : 'sell',
          txHash,
          blockNumber: 0,
          timestamp: new Date(t.Block?.Time || Date.now()).getTime(),
        };

        // Auto-add curve if not tracked yet
        if (!this.curveStore.getCurve(tokenAddress)) {
          const name = t.Trade?.Currency?.Name || 'Unknown';
          const symbol = t.Trade?.Currency?.Symbol || '???';
          this.curveStore.addCurve(tokenAddress, name, symbol, trade.timestamp);
        }

        const updated = this.curveStore.updateCurve(tokenAddress, trade);
        if (updated) {
          this.emit('trade', trade, updated);

          // Check if fill crossed a 5% threshold
          const prevFill = updated.filledPercent - (trade.bnbAmount / config.thresholds.graduationBnbTarget) * 100;
          const prevBucket = Math.floor(prevFill / 5);
          const newBucket = Math.floor(updated.filledPercent / 5);
          if (newBucket > prevBucket) {
            this.emit('score:trigger', tokenAddress);
          }
        }
      }
    } catch (err) {
      log.error({ err }, 'Failed to handle trade event');
    }
  }

  stop(): void {
    this.bitquery.unsubscribe('new-tokens');
    this.bitquery.unsubscribe('trades');
    log.info('Bonding monitor stopped');
  }
}
