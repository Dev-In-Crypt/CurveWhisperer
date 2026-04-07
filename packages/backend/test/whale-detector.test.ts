import { describe, it, expect, beforeEach } from 'vitest';
import { CurveStore } from '../src/state/curve-store.js';
import { WhaleDetector } from '../src/collector/whale-detector.js';
import { TradeEvent } from '../src/utils/types.js';

function makeTrade(overrides: Partial<TradeEvent> = {}): TradeEvent {
  return {
    tokenAddress: '0xaaa',
    buyer: '0xbuyer1',
    bnbAmount: 0.1,
    tokenAmount: 1000,
    direction: 'buy',
    txHash: '0xtx' + Math.random(),
    blockNumber: 100,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('WhaleDetector', () => {
  let store: CurveStore;
  let detector: WhaleDetector;

  beforeEach(() => {
    store = new CurveStore();
    detector = new WhaleDetector(store);
    store.addCurve('0xaaa', 'TestToken', 'TT', Date.now());
  });

  it('detects large buy (>0.5 BNB)', () => {
    store.updateCurve('0xaaa', makeTrade({ bnbAmount: 0.6 }));
    const alert = detector.analyzeTrade(makeTrade({ bnbAmount: 0.6 }));
    expect(alert).not.toBeNull();
    expect(alert!.alertType).toBe('large_buy');
    expect(alert!.severity).toBe('low');
  });

  it('large buy >1 BNB is medium severity', () => {
    store.updateCurve('0xaaa', makeTrade({ bnbAmount: 1.5 }));
    const alert = detector.analyzeTrade(makeTrade({ bnbAmount: 1.5 }));
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('medium');
  });

  it('large buy >2 BNB is high severity', () => {
    store.updateCurve('0xaaa', makeTrade({ bnbAmount: 3 }));
    const alert = detector.analyzeTrade(makeTrade({ bnbAmount: 3 }));
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('high');
  });

  it('ignores small buys with diverse holders', () => {
    // Spread across many buyers so no concentration triggers
    for (let i = 0; i < 10; i++) {
      store.updateCurve('0xaaa', makeTrade({ buyer: `0xb${i}`, bnbAmount: 0.1 }));
    }
    const alert = detector.analyzeTrade(makeTrade({ buyer: '0xnew', bnbAmount: 0.1 }));
    expect(alert).toBeNull();
  });

  it('ignores sells', () => {
    const alert = detector.analyzeTrade(makeTrade({ bnbAmount: 5, direction: 'sell' }));
    expect(alert).toBeNull();
  });

  it('detects concentration (>20%)', () => {
    // Buyer1 buys 3 BNB, total is 10 → 30%
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xother', bnbAmount: 0.3 }));
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xother2', bnbAmount: 0.3 }));
    // Small buy that triggers detection with existing balance
    const smallTrade = makeTrade({ buyer: '0xwhale', bnbAmount: 0.1 });
    // First give the whale a big position
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xwhale', bnbAmount: 0.3 }));
    // Now whale has 0.3 / 1.0 = 30% → dominance
    const alert = detector.analyzeTrade(makeTrade({ buyer: '0xwhale', bnbAmount: 0.1 }));
    expect(alert).not.toBeNull();
    // Should be dominance (>30%) or concentration (>20%)
    expect(['concentration', 'dominance']).toContain(alert!.alertType);
  });

  it('emits whale:alert event', () => {
    store.updateCurve('0xaaa', makeTrade({ bnbAmount: 1 }));
    let emitted = false;
    detector.on('whale:alert', () => { emitted = true; });
    detector.analyzeTrade(makeTrade({ bnbAmount: 1 }));
    expect(emitted).toBe(true);
  });

  it('returns null for unknown token', () => {
    const alert = detector.analyzeTrade(makeTrade({ tokenAddress: '0xunknown', bnbAmount: 5 }));
    expect(alert).toBeNull();
  });
});
