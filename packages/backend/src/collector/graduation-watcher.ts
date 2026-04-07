import { EventEmitter } from 'events';
import { BitqueryClient } from '../utils/bitquery.js';
import { CurveStore } from '../state/curve-store.js';
import { GraduationAlert } from '../utils/types.js';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('graduation-watcher');
let alertIdCounter = 0;

const GRADUATION_SUB = `
subscription {
  EVM(network: bsc) {
    Events(
      where: {
        Log: { Signature: { Name: { in: ["PairCreated", "PoolCreated"] } } }
        Transaction: {
          To: { is: "${config.fourMeme.factoryAddress}" }
        }
      }
    ) {
      Arguments {
        Name
        Value {
          ... on EVM_ABI_Address_Value_Arg { address }
        }
      }
      Transaction { Hash }
      Block { Time }
    }
  }
}
`;

export class GraduationWatcher extends EventEmitter {
  private bitquery: BitqueryClient;
  private curveStore: CurveStore;

  constructor(bitquery: BitqueryClient, curveStore: CurveStore) {
    super();
    this.bitquery = bitquery;
    this.curveStore = curveStore;
  }

  start(): void {
    log.info('Starting graduation watcher...');

    this.bitquery.subscribe(
      'graduations',
      GRADUATION_SUB,
      undefined,
      (data) => this.handleGraduation(data),
      (err) => log.error({ err: err.message }, 'Graduation subscription error'),
    );

    log.info('Graduation watcher started');
  }

  private handleGraduation(data: unknown): void {
    try {
      const events = (data as any)?.EVM?.Events;
      if (!Array.isArray(events)) return;

      for (const event of events) {
        // Extract token address from event arguments
        let tokenAddress: string | null = null;
        for (const arg of event.Arguments || []) {
          if (arg.Name === 'token0' || arg.Name === 'token1' || arg.Name === 'token') {
            const addr = arg.Value?.address;
            if (addr && addr.toLowerCase() !== config.fourMeme.wbnb.toLowerCase()) {
              tokenAddress = addr;
              break;
            }
          }
        }

        if (!tokenAddress) continue;

        const state = this.curveStore.getCurve(tokenAddress);
        if (!state) {
          log.warn({ tokenAddress }, 'Graduation for untracked token');
          continue;
        }

        const eventTime = new Date(event.Block?.Time || Date.now()).getTime();
        const durationMs = eventTime - state.createdAt;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const timeToGraduate = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const alert: GraduationAlert = {
          id: `grad_${++alertIdCounter}`,
          tokenAddress,
          name: state.name,
          symbol: state.symbol,
          timeToGraduate,
          totalBnb: state.totalBnb,
          uniqueBuyers: state.uniqueBuyers,
          topHolderPercent: state.topHolders[0]?.percent || 0,
          lastAiScore: state.lastScore?.score || null,
          timestamp: eventTime,
        };

        log.info(
          { name: state.name, timeToGraduate, buyers: state.uniqueBuyers },
          'Token graduated!'
        );

        this.emit('graduation:alert', alert);
        this.curveStore.removeCurve(tokenAddress);
      }
    } catch (err) {
      log.error({ err }, 'Failed to handle graduation event');
    }
  }

  stop(): void {
    this.bitquery.unsubscribe('graduations');
    log.info('Graduation watcher stopped');
  }
}
