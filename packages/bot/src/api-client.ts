const API_URL = (process.env.BACKEND_URL || 'https://cwbackend-production.up.railway.app').replace(/\/+$/, '');

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export interface CurveData {
  address: string;
  name: string;
  symbol: string;
  filledPercent: number;
  totalBnb: number;
  uniqueBuyers: number;
  velocity: number;
  velocityTrend: string;
  hhi: number;
  topHolders: { address: string; percent: number }[];
  lastScore: ScoreData | null;
}

export interface ScoreData {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  risks: string[];
  bullishFactors: string[];
  source: string;
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

export async function fetchCurves(sortBy = 'score', limit = 10): Promise<CurveData[]> {
  const data = await fetchJSON<{ curves: CurveData[] }>(`/api/curves?sortBy=${sortBy}&limit=${limit}`);
  return data?.curves || [];
}

export async function fetchCurve(address: string): Promise<CurveData | null> {
  const data = await fetchJSON<{ curve: CurveData }>(`/api/curves/${address}`);
  return data?.curve || null;
}

export async function fetchAlerts(limit = 20): Promise<AlertData[]> {
  const data = await fetchJSON<{ alerts: AlertData[] }>(`/api/alerts?limit=${limit}`);
  return data?.alerts || [];
}

export async function fetchStats(): Promise<StatsData | null> {
  return fetchJSON<StatsData>('/api/stats');
}
