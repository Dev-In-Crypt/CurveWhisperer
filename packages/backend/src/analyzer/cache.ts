import { ScoreResult } from '../utils/types.js';
import { config } from '../config.js';

interface CacheEntry {
  result: ScoreResult;
  expiresAt: number;
}

export class ScoreCache {
  private cache = new Map<string, CacheEntry>();

  constructor() {
    // Auto-cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(tokenAddress: string): ScoreResult | null {
    const key = tokenAddress.toLowerCase();
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.result;
  }

  set(tokenAddress: string, result: ScoreResult): void {
    const key = tokenAddress.toLowerCase();
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + config.thresholds.scoreTtlSec * 1000,
    });
  }

  invalidate(tokenAddress: string): void {
    this.cache.delete(tokenAddress.toLowerCase());
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) this.cache.delete(key);
    }
  }
}
