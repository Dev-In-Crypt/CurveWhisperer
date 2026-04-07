import { describe, it, expect, beforeEach } from 'vitest';
import { CurveStore } from '../src/state/curve-store.js';
import { TradeEvent } from '../src/utils/types.js';

function makeTrade(overrides: Partial<TradeEvent> = {}): TradeEvent {
  return {
    tokenAddress: '0xaaa',
    buyer: '0xbuyer1',
    bnbAmount: 1,
    tokenAmount: 1000,
    direction: 'buy',
    txHash: '0xtx' + Math.random(),
    blockNumber: 100,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('CurveStore', () => {
  let store: CurveStore;

  beforeEach(() => {
    store = new CurveStore();
  });

  it('adds a curve and retrieves it', () => {
    store.addCurve('0xAAA', 'TestToken', 'TT', Date.now());
    const curve = store.getCurve('0xaaa');
    expect(curve).not.toBeNull();
    expect(curve!.name).toBe('TestToken');
    expect(curve!.symbol).toBe('TT');
    expect(curve!.filledPercent).toBe(0);
    expect(store.size).toBe(1);
  });

  it('normalizes address to lowercase', () => {
    store.addCurve('0xAAA', 'Test', 'T', Date.now());
    expect(store.getCurve('0xaaa')).not.toBeNull();
    expect(store.getCurve('0xAAA')).not.toBeNull();
  });

  it('does not duplicate on re-add', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.addCurve('0xaaa', 'Test2', 'T2', Date.now());
    expect(store.size).toBe(1);
    expect(store.getCurve('0xaaa')!.name).toBe('Test');
  });

  it('updates curve on trade', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    const trade = makeTrade({ bnbAmount: 2 });
    const updated = store.updateCurve('0xaaa', trade);

    expect(updated).not.toBeNull();
    expect(updated!.totalBnb).toBe(2);
    expect(updated!.uniqueBuyers).toBe(1);
    expect(updated!.filledPercent).toBeCloseTo((2 / 18) * 100, 1);
  });

  it('tracks multiple buyers', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 1 }));
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb2', bnbAmount: 2 }));
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb3', bnbAmount: 3 }));

    const curve = store.getCurve('0xaaa')!;
    expect(curve.uniqueBuyers).toBe(3);
    expect(curve.totalBnb).toBe(6);
    expect(curve.topHolders).toHaveLength(3);
    expect(curve.topHolders[0].address).toBe('0xb3'); // largest
  });

  it('handles sell reducing totalBnb', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 5 }));
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 2, direction: 'sell' }));

    const curve = store.getCurve('0xaaa')!;
    expect(curve.totalBnb).toBe(3);
  });

  it('totalBnb does not go below zero', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 1 }));
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 5, direction: 'sell' }));

    expect(store.getCurve('0xaaa')!.totalBnb).toBe(0);
  });

  it('calculates HHI correctly', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    // Two equal buyers → HHI = (0.5^2 + 0.5^2) * 10000 = 5000
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 1 }));
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb2', bnbAmount: 1 }));

    expect(store.getCurve('0xaaa')!.hhi).toBe(5000);
  });

  it('calculates HHI for single holder as 10000', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 5 }));

    expect(store.getCurve('0xaaa')!.hhi).toBe(10000);
  });

  it('caps filledPercent at 100', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.updateCurve('0xaaa', makeTrade({ buyer: '0xb1', bnbAmount: 20 }));

    expect(store.getCurve('0xaaa')!.filledPercent).toBe(100);
  });

  it('removes a curve', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    store.removeCurve('0xaaa');
    expect(store.getCurve('0xaaa')).toBeNull();
    expect(store.size).toBe(0);
  });

  it('returns null for unknown curve update', () => {
    expect(store.updateCurve('0xunknown', makeTrade())).toBeNull();
  });

  it('sorts by score descending', () => {
    store.addCurve('0xaaa', 'Low', 'L', Date.now());
    store.addCurve('0xbbb', 'High', 'H', Date.now());
    store.updateScore('0xaaa', { score: 20, confidence: 'low', reasoning: '', risks: [], bullishFactors: [], source: 'rule-engine', timestamp: Date.now() });
    store.updateScore('0xbbb', { score: 80, confidence: 'high', reasoning: '', risks: [], bullishFactors: [], source: 'llm', timestamp: Date.now() });

    const top = store.getTopByScore(10);
    expect(top[0].name).toBe('High');
    expect(top[1].name).toBe('Low');
  });

  it('emits curve:new event', () => {
    let emitted = false;
    store.on('curve:new', () => { emitted = true; });
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    expect(emitted).toBe(true);
  });

  it('emits curve:updated event', () => {
    store.addCurve('0xaaa', 'Test', 'T', Date.now());
    let emitted = false;
    store.on('curve:updated', () => { emitted = true; });
    store.updateCurve('0xaaa', makeTrade());
    expect(emitted).toBe(true);
  });
});
