import { CurveState, ScoreResult } from '../utils/types.js';

export function calculateRuleBasedScore(state: CurveState): ScoreResult {
  const reasons: string[] = [];
  let total = 0;

  // Fill component (0-50)
  const fillPoints = Math.min(state.filledPercent * 0.5, 50);
  total += fillPoints;
  if (fillPoints >= 25) reasons.push(`Good fill at ${state.filledPercent.toFixed(0)}%`);

  // Velocity component (-10 to +15)
  switch (state.velocityTrend) {
    case 'accelerating':
      total += 15;
      reasons.push('Accelerating buy pressure');
      break;
    case 'stable':
      total += 5;
      break;
    case 'decelerating':
      reasons.push('Decelerating velocity');
      break;
    case 'stalled':
      total -= 10;
      reasons.push('Trading has stalled');
      break;
  }

  // Buyer diversity (0 to +10)
  if (state.hhi < 1500) {
    total += 10;
    reasons.push('Healthy buyer distribution');
  } else if (state.hhi < 2500) {
    total += 5;
  }

  // Buyer count (0-10)
  if (state.uniqueBuyers > 20) {
    total += 10;
    reasons.push(`${state.uniqueBuyers} unique buyers`);
  } else if (state.uniqueBuyers > 10) {
    total += 5;
  }

  // Concentration penalty (-15 to 0)
  const topHolder = state.topHolders[0]?.percent || 0;
  if (topHolder > 30) {
    total -= 15;
    reasons.push(`High concentration: top holder owns ${topHolder.toFixed(0)}%`);
  } else if (topHolder > 20) {
    total -= 10;
    reasons.push(`Moderate concentration: top holder owns ${topHolder.toFixed(0)}%`);
  }

  const score = Math.max(0, Math.min(100, Math.round(total)));

  return {
    score,
    confidence: 'low',
    reasoning: reasons.length > 0 ? reasons.join('. ') + '.' : 'Insufficient data for analysis.',
    risks: reasons.filter(r => r.includes('concentration') || r.includes('stalled') || r.includes('Decelerating')),
    bullishFactors: reasons.filter(r => r.includes('Accelerating') || r.includes('Healthy') || r.includes('Good fill') || r.includes('unique buyers')),
    source: 'rule-engine',
    timestamp: Date.now(),
  };
}
