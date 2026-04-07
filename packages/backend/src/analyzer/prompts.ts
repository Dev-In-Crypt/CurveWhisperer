import { CurveState } from '../utils/types.js';

export const SYSTEM_PROMPT = `You are a quantitative analyst for BNB Chain's Four.Meme memecoin launchpad.

CONTEXT:
- Four.Meme uses bonding curves to launch tokens. Each token starts on a bonding curve.
- When ~18 BNB is raised (800M tokens sold), the token "graduates" to PancakeSwap DEX with real liquidity.
- Only ~1.3% of all tokens ever graduate. Most die on the curve.
- Your job: estimate the probability this token will graduate, from 0 (will die) to 100 (almost certain graduation).

OUTPUT FORMAT:
Respond ONLY with a JSON object. No markdown, no explanation outside JSON.

{
  "score": <number 0-100>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<2-3 sentences explaining your assessment>",
  "risks": ["<risk factor 1>", "<risk factor 2>"],
  "bullishFactors": ["<positive factor 1>", "<positive factor 2>"]
}

EXAMPLES:

Token at 65% fill, 4.2 BNB/hr velocity (accelerating), 45 unique buyers, HHI=800:
{"score":78,"confidence":"high","reasoning":"Strong momentum with accelerating velocity and healthy buyer distribution. At 65% fill with broad participation, graduation is likely if momentum holds.","risks":["Velocity could drop if hype fades","Still needs ~6 BNB to graduate"],"bullishFactors":["Accelerating buy pressure","Low concentration (HHI 800)","45 unique buyers shows organic interest"]}

Token at 12% fill, 0.3 BNB/hr velocity (decelerating), 8 buyers, HHI=4200:
{"score":15,"confidence":"medium","reasoning":"Low fill with decelerating velocity and highly concentrated ownership. The top holder dominates, suggesting possible pump-and-dump setup.","risks":["Decelerating velocity","Very high concentration","Only 8 buyers"],"bullishFactors":["Still early - could attract attention"]}`;

export function buildUserPrompt(state: CurveState): string {
  const ageMs = Date.now() - state.createdAt;
  const ageMinutes = Math.round(ageMs / 60000);

  const top3Percent = state.topHolders.slice(0, 3).reduce((sum, h) => sum + h.percent, 0);

  const hhiLabel = state.hhi < 1500 ? 'low concentration'
    : state.hhi < 2500 ? 'moderate concentration'
    : 'high concentration';

  return `Token: ${state.name} (${state.symbol}) — ${state.address}
Age: ${ageMinutes} minutes
Fill: ${state.filledPercent.toFixed(1)}% (${state.totalBnb.toFixed(3)} BNB / 18 BNB)
Velocity: ${state.velocity.toFixed(2)} BNB/hr (trend: ${state.velocityTrend})
Buyers: ${state.uniqueBuyers} unique
HHI: ${state.hhi} (${hhiLabel})
Top holder: ${(state.topHolders[0]?.percent || 0).toFixed(1)}%
Top 3 combined: ${top3Percent.toFixed(1)}%`;
}
