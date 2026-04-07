export interface CurveState {
  address: string;
  name: string;
  symbol: string;
  filledPercent: number;
  totalBnb: number;
  uniqueBuyers: number;
  buyerBalances: Map<string, number>;
  velocity: number;
  velocityTrend: 'accelerating' | 'decelerating' | 'stable' | 'stalled';
  hhi: number;
  topHolders: { address: string; percent: number }[];
  createdAt: number;
  lastActivityAt: number;
  lastScore: ScoreResult | null;
  trades: TradeEvent[];
}

export interface TradeEvent {
  tokenAddress: string;
  buyer: string;
  bnbAmount: number;
  tokenAmount: number;
  direction: 'buy' | 'sell';
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface WhaleAlert {
  id: string;
  tokenAddress: string;
  tokenName: string;
  alertType: 'large_buy' | 'concentration' | 'dominance' | 'cluster';
  details: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface GraduationAlert {
  id: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  timeToGraduate: string;
  totalBnb: number;
  uniqueBuyers: number;
  topHolderPercent: number;
  lastAiScore: number | null;
  timestamp: number;
}

export interface ScoreResult {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  risks: string[];
  bullishFactors: string[];
  source: 'llm' | 'rule-engine';
  timestamp: number;
}

export type Alert = WhaleAlert | GraduationAlert;

export function isWhaleAlert(a: Alert): a is WhaleAlert {
  return 'alertType' in a;
}

export function isGraduationAlert(a: Alert): a is GraduationAlert {
  return 'timeToGraduate' in a;
}
