import { EventEmitter } from 'events';
import { CurveStore } from '../state/curve-store.js';
import { TradeEvent, WhaleAlert } from '../utils/types.js';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('whale-detector');
let alertIdCounter = 0;

export class WhaleDetector extends EventEmitter {
  private curveStore: CurveStore;
  private lastClusterCheck = new Map<string, number>();

  constructor(curveStore: CurveStore) {
    super();
    this.curveStore = curveStore;
  }

  analyzeTrade(trade: TradeEvent): WhaleAlert | null {
    if (trade.direction !== 'buy') return null;

    const state = this.curveStore.getCurve(trade.tokenAddress);
    if (!state) return null;

    // Check 1: Large single buy
    if (trade.bnbAmount >= config.thresholds.whaleBnb) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (trade.bnbAmount >= 2) severity = 'high';
      else if (trade.bnbAmount >= 1) severity = 'medium';

      const alert: WhaleAlert = {
        id: `whale_${++alertIdCounter}`,
        tokenAddress: trade.tokenAddress,
        tokenName: state.name,
        alertType: 'large_buy',
        details: `${trade.bnbAmount.toFixed(3)} BNB buy by ${trade.buyer.slice(0, 10)}...`,
        severity,
        timestamp: Date.now(),
      };

      log.info({ alert: alert.id, severity, bnb: trade.bnbAmount }, 'Large buy detected');
      this.emit('whale:alert', alert);
      return alert;
    }

    // Check 2: Concentration — buyer's cumulative share > 20%
    if (state.totalBnb > 0) {
      const buyerBalance = state.buyerBalances.get(trade.buyer) || 0;
      const share = buyerBalance / state.totalBnb;

      if (share > config.thresholds.dominanceWarning) {
        // Check 3: Top holder dominance > 30%
        const alert: WhaleAlert = {
          id: `whale_${++alertIdCounter}`,
          tokenAddress: trade.tokenAddress,
          tokenName: state.name,
          alertType: 'dominance',
          details: `Single holder owns ${(share * 100).toFixed(1)}% of supply`,
          severity: 'high',
          timestamp: Date.now(),
        };
        log.info({ alert: alert.id, share: share * 100 }, 'Dominance detected');
        this.emit('whale:alert', alert);
        return alert;
      }

      if (share > config.thresholds.concentrationWarning) {
        const alert: WhaleAlert = {
          id: `whale_${++alertIdCounter}`,
          tokenAddress: trade.tokenAddress,
          tokenName: state.name,
          alertType: 'concentration',
          details: `Holder accumulated ${(share * 100).toFixed(1)}% of total BNB`,
          severity: 'medium',
          timestamp: Date.now(),
        };
        log.info({ alert: alert.id, share: share * 100 }, 'Concentration detected');
        this.emit('whale:alert', alert);
        return alert;
      }
    }

    return null;
  }
}
