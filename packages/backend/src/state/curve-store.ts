import { EventEmitter } from 'events';
import { CurveState, TradeEvent, ScoreResult } from '../utils/types.js';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('curve-store');
const VELOCITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const STALL_THRESHOLD_MS = 30 * 60 * 1000; // 30 min

export class CurveStore extends EventEmitter {
  private curves = new Map<string, CurveState>();

  addCurve(address: string, name: string, symbol: string, createdAt: number): CurveState {
    const key = address.toLowerCase();
    if (this.curves.has(key)) return this.curves.get(key)!;

    const state: CurveState = {
      address: key,
      name,
      symbol,
      filledPercent: 0,
      totalBnb: 0,
      uniqueBuyers: 0,
      buyerBalances: new Map(),
      velocity: 0,
      velocityTrend: 'stable',
      hhi: 0,
      topHolders: [],
      createdAt,
      lastActivityAt: createdAt,
      lastScore: null,
      trades: [],
    };

    this.curves.set(key, state);
    this.emit('curve:new', state);
    log.info({ name, symbol, address: key }, 'New curve added');
    return state;
  }

  updateCurve(address: string, trade: TradeEvent): CurveState | null {
    const key = address.toLowerCase();
    const state = this.curves.get(key);
    if (!state) return null;

    // Add trade to rolling window
    state.trades.push(trade);
    // Keep only trades from last 2 hours
    const cutoff = Date.now() - 2 * VELOCITY_WINDOW_MS;
    state.trades = state.trades.filter(t => t.timestamp > cutoff);

    // Update BNB total
    if (trade.direction === 'buy') {
      state.totalBnb += trade.bnbAmount;
      const prev = state.buyerBalances.get(trade.buyer) || 0;
      state.buyerBalances.set(trade.buyer, prev + trade.bnbAmount);
    } else {
      state.totalBnb = Math.max(0, state.totalBnb - trade.bnbAmount);
      const prev = state.buyerBalances.get(trade.buyer) || 0;
      state.buyerBalances.set(trade.buyer, Math.max(0, prev - trade.bnbAmount));
    }

    // Fill percent
    state.filledPercent = Math.min(100, (state.totalBnb / config.thresholds.graduationBnbTarget) * 100);

    // Unique buyers
    state.uniqueBuyers = state.buyerBalances.size;

    // Velocity (BNB/hr in last hour)
    const now = Date.now();
    const recentTrades = state.trades.filter(t => t.timestamp > now - VELOCITY_WINDOW_MS);
    const recentBnb = recentTrades
      .filter(t => t.direction === 'buy')
      .reduce((sum, t) => sum + t.bnbAmount, 0);
    const hours = VELOCITY_WINDOW_MS / (1000 * 60 * 60);
    state.velocity = recentBnb / hours;

    // Velocity trend
    const midpoint = now - VELOCITY_WINDOW_MS / 2;
    const recentHalf = recentTrades.filter(t => t.timestamp > midpoint && t.direction === 'buy')
      .reduce((s, t) => s + t.bnbAmount, 0);
    const olderHalf = recentTrades.filter(t => t.timestamp <= midpoint && t.direction === 'buy')
      .reduce((s, t) => s + t.bnbAmount, 0);

    if (now - state.lastActivityAt > STALL_THRESHOLD_MS && recentTrades.length === 0) {
      state.velocityTrend = 'stalled';
    } else if (olderHalf === 0) {
      state.velocityTrend = recentHalf > 0 ? 'accelerating' : 'stable';
    } else if (recentHalf > olderHalf * 1.5) {
      state.velocityTrend = 'accelerating';
    } else if (recentHalf < olderHalf * 0.5) {
      state.velocityTrend = 'decelerating';
    } else {
      state.velocityTrend = 'stable';
    }

    // HHI (Herfindahl-Hirschman Index)
    if (state.totalBnb > 0) {
      let hhiSum = 0;
      for (const balance of state.buyerBalances.values()) {
        const share = balance / state.totalBnb;
        hhiSum += share * share;
      }
      state.hhi = Math.round(hhiSum * 10000);
    }

    // Top holders
    const sorted = Array.from(state.buyerBalances.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    state.topHolders = sorted.map(([addr, bal]) => ({
      address: addr,
      percent: state.totalBnb > 0 ? (bal / state.totalBnb) * 100 : 0,
    }));

    state.lastActivityAt = trade.timestamp;

    this.emit('curve:updated', state);
    return state;
  }

  updateScore(address: string, score: ScoreResult): void {
    const key = address.toLowerCase();
    const state = this.curves.get(key);
    if (state) {
      state.lastScore = score;
    }
  }

  removeCurve(address: string): void {
    const key = address.toLowerCase();
    this.curves.delete(key);
    this.emit('curve:removed', key);
    log.info({ address: key }, 'Curve removed');
  }

  getCurve(address: string): CurveState | null {
    return this.curves.get(address.toLowerCase()) || null;
  }

  getActiveCurves(sortBy: string = 'score', limit: number = 50): CurveState[] {
    let arr = Array.from(this.curves.values());

    switch (sortBy) {
      case 'score':
        arr.sort((a, b) => (b.lastScore?.score || 0) - (a.lastScore?.score || 0));
        break;
      case 'fill':
        arr.sort((a, b) => b.filledPercent - a.filledPercent);
        break;
      case 'velocity':
        arr.sort((a, b) => b.velocity - a.velocity);
        break;
      case 'newest':
        arr.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return arr.slice(0, limit);
  }

  getTopByScore(limit: number = 10): CurveState[] {
    return this.getActiveCurves('score', limit);
  }

  get size(): number {
    return this.curves.size;
  }
}
