import { API_URL } from './constants';

export interface CurveData {
  address: string;
  name: string;
  symbol: string;
  filledPercent: number;
  totalBnb: number;
  uniqueBuyers: number;
  velocity: number;
  velocityTrend: 'accelerating' | 'decelerating' | 'stable' | 'stalled';
  hhi: number;
  topHolders: { address: string; percent: number }[];
  createdAt: number;
  lastActivityAt: number;
  lastScore: ScoreData | null;
}

export interface ScoreData {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  risks: string[];
  bullishFactors: string[];
  source: 'llm' | 'rule-engine';
  timestamp: number;
}

export interface AlertData {
  id: string;
  tokenAddress: string;
  tokenName?: string;
  alertType?: string;
  details?: string;
  severity?: string;
  name?: string;
  symbol?: string;
  timeToGraduate?: string;
  totalBnb?: number;
  uniqueBuyers?: number;
  timestamp: number;
}

export interface StatsData {
  activeCurves: number;
  graduationsToday: number;
  topScore: { name: string; score: number; address: string } | null;
}

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function fetchCurves(params?: {
  sortBy?: string;
  limit?: number;
  minFill?: number;
}): Promise<{ curves: CurveData[]; total: number } | null> {
  const query = new URLSearchParams();
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.minFill) query.set('minFill', String(params.minFill));
  const qs = query.toString();
  return fetchJSON(`/api/curves${qs ? `?${qs}` : ''}`);
}

export async function fetchCurveDetail(address: string): Promise<{
  curve: CurveData;
  alerts: AlertData[];
} | null> {
  return fetchJSON(`/api/curves/${address}`);
}

export async function fetchAlerts(params?: {
  type?: string;
  limit?: number;
}): Promise<{ alerts: AlertData[] } | null> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return fetchJSON(`/api/alerts${qs ? `?${qs}` : ''}`);
}

export async function fetchStats(): Promise<StatsData | null> {
  return fetchJSON('/api/stats');
}
