import { describe, it, expect } from 'vitest';
import { calculateRuleBasedScore } from '../src/analyzer/rule-engine.js';
import { CurveState } from '../src/utils/types.js';

function makeState(overrides: Partial<CurveState> = {}): CurveState {
  return {
    address: '0xaaa',
    name: 'Test',
    symbol: 'T',
    filledPercent: 50,
    totalBnb: 9,
    uniqueBuyers: 15,
    buyerBalances: new Map(),
    velocity: 2,
    velocityTrend: 'stable',
    hhi: 2000,
    topHolders: [{ address: '0xb1', percent: 15 }],
    createdAt: Date.now() - 3600000,
    lastActivityAt: Date.now(),
    lastScore: null,
    trades: [],
    ...overrides,
  };
}

describe('Rule Engine', () => {
  it('returns score between 0 and 100', () => {
    const result = calculateRuleBasedScore(makeState());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('source is always rule-engine', () => {
    const result = calculateRuleBasedScore(makeState());
    expect(result.source).toBe('rule-engine');
  });

  it('confidence is always low', () => {
    const result = calculateRuleBasedScore(makeState());
    expect(result.confidence).toBe('low');
  });

  it('high fill gives higher score', () => {
    const low = calculateRuleBasedScore(makeState({ filledPercent: 10 }));
    const high = calculateRuleBasedScore(makeState({ filledPercent: 80 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('accelerating velocity boosts score', () => {
    const stable = calculateRuleBasedScore(makeState({ velocityTrend: 'stable' }));
    const accel = calculateRuleBasedScore(makeState({ velocityTrend: 'accelerating' }));
    expect(accel.score).toBeGreaterThan(stable.score);
  });

  it('stalled velocity reduces score', () => {
    const stable = calculateRuleBasedScore(makeState({ velocityTrend: 'stable' }));
    const stalled = calculateRuleBasedScore(makeState({ velocityTrend: 'stalled' }));
    expect(stalled.score).toBeLessThan(stable.score);
  });

  it('low HHI (diverse) boosts score', () => {
    const high = calculateRuleBasedScore(makeState({ hhi: 3000 }));
    const low = calculateRuleBasedScore(makeState({ hhi: 1000 }));
    expect(low.score).toBeGreaterThan(high.score);
  });

  it('many buyers boosts score', () => {
    const few = calculateRuleBasedScore(makeState({ uniqueBuyers: 5 }));
    const many = calculateRuleBasedScore(makeState({ uniqueBuyers: 25 }));
    expect(many.score).toBeGreaterThan(few.score);
  });

  it('high concentration penalizes score', () => {
    const normal = calculateRuleBasedScore(makeState({
      topHolders: [{ address: '0x1', percent: 10 }],
    }));
    const concentrated = calculateRuleBasedScore(makeState({
      topHolders: [{ address: '0x1', percent: 35 }],
    }));
    expect(concentrated.score).toBeLessThan(normal.score);
  });

  it('best case gives high score', () => {
    const result = calculateRuleBasedScore(makeState({
      filledPercent: 90,
      velocityTrend: 'accelerating',
      hhi: 800,
      uniqueBuyers: 50,
      topHolders: [{ address: '0x1', percent: 5 }],
    }));
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('worst case gives low score', () => {
    const result = calculateRuleBasedScore(makeState({
      filledPercent: 2,
      velocityTrend: 'stalled',
      hhi: 5000,
      uniqueBuyers: 3,
      topHolders: [{ address: '0x1', percent: 50 }],
    }));
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it('includes risks in result', () => {
    const result = calculateRuleBasedScore(makeState({
      velocityTrend: 'stalled',
      topHolders: [{ address: '0x1', percent: 35 }],
    }));
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it('includes bullish factors in result', () => {
    const result = calculateRuleBasedScore(makeState({
      filledPercent: 80,
      velocityTrend: 'accelerating',
      hhi: 1000,
      uniqueBuyers: 30,
    }));
    expect(result.bullishFactors.length).toBeGreaterThan(0);
  });
});
