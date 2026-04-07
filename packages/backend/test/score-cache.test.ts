import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreCache } from '../src/analyzer/cache.js';
import { ScoreResult } from '../src/utils/types.js';

function makeScore(score = 50): ScoreResult {
  return {
    score,
    confidence: 'medium',
    reasoning: 'test',
    risks: [],
    bullishFactors: [],
    source: 'rule-engine',
    timestamp: Date.now(),
  };
}

describe('ScoreCache', () => {
  let cache: ScoreCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new ScoreCache();
  });

  it('stores and retrieves a score', () => {
    cache.set('0xaaa', makeScore(75));
    const result = cache.get('0xaaa');
    expect(result).not.toBeNull();
    expect(result!.score).toBe(75);
  });

  it('normalizes address to lowercase', () => {
    cache.set('0xAAA', makeScore(75));
    expect(cache.get('0xaaa')).not.toBeNull();
  });

  it('returns null for unknown token', () => {
    expect(cache.get('0xunknown')).toBeNull();
  });

  it('returns null for expired entry', () => {
    cache.set('0xaaa', makeScore(75));
    // Advance past TTL (60s default)
    vi.advanceTimersByTime(61000);
    expect(cache.get('0xaaa')).toBeNull();
  });

  it('returns valid entry before TTL', () => {
    cache.set('0xaaa', makeScore(75));
    vi.advanceTimersByTime(30000);
    expect(cache.get('0xaaa')).not.toBeNull();
  });

  it('invalidates a specific token', () => {
    cache.set('0xaaa', makeScore(75));
    cache.invalidate('0xaaa');
    expect(cache.get('0xaaa')).toBeNull();
  });

  it('clear removes all entries', () => {
    cache.set('0xaaa', makeScore(1));
    cache.set('0xbbb', makeScore(2));
    cache.clear();
    expect(cache.get('0xaaa')).toBeNull();
    expect(cache.get('0xbbb')).toBeNull();
  });

  it('overwrites previous entry', () => {
    cache.set('0xaaa', makeScore(50));
    cache.set('0xaaa', makeScore(90));
    expect(cache.get('0xaaa')!.score).toBe(90);
  });
});
