import { ScoreResult, CurveState } from '@cw/backend/src/utils/types.js';

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function scoreEmoji(score: number): string {
  if (score >= 70) return '🟢';
  if (score >= 40) return '🟡';
  return '🔴';
}

export function formatScoreCard(curve: CurveState, score: ScoreResult): string {
  const emoji = scoreEmoji(score.score);
  const bar = scoreBar(score.score);

  let msg = `${emoji} *${escapeMarkdown(curve.name)}* (${escapeMarkdown(curve.symbol)})\n`;
  msg += `\`${bar} ${score.score}/100\`\n\n`;
  msg += `📊 *Fill:* ${curve.filledPercent.toFixed(1)}% (${curve.totalBnb.toFixed(3)} BNB)\n`;
  msg += `⚡ *Velocity:* ${curve.velocity.toFixed(2)} BNB/hr (${curve.velocityTrend})\n`;
  msg += `👥 *Buyers:* ${curve.uniqueBuyers}\n`;
  msg += `📈 *HHI:* ${curve.hhi}\n`;
  msg += `🎯 *Confidence:* ${score.confidence}\n\n`;

  msg += `_${escapeMarkdown(score.reasoning)}_\n\n`;

  if (score.risks.length > 0) {
    msg += score.risks.map(r => `⚠️ ${escapeMarkdown(r)}`).join('\n') + '\n';
  }
  if (score.bullishFactors.length > 0) {
    msg += score.bullishFactors.map(f => `✅ ${escapeMarkdown(f)}`).join('\n') + '\n';
  }

  msg += `\n_Source: ${score.source === 'llm' ? 'AI' : 'Rule\\-based fallback'}_`;

  return msg;
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}
