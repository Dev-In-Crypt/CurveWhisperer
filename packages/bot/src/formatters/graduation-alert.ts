import { GraduationAlert } from '@cw/backend/src/utils/types.js';
import { escapeMarkdown } from './score-card.js';

export function formatGraduationAlert(alert: GraduationAlert): string {
  let msg = `🎓 *Graduated\\!* — ${escapeMarkdown(alert.name)} (${escapeMarkdown(alert.symbol)})\n\n`;
  msg += `⏱ *Time:* ${escapeMarkdown(alert.timeToGraduate)}\n`;
  msg += `💰 *Total BNB:* ${alert.totalBnb.toFixed(3)}\n`;
  msg += `👥 *Buyers:* ${alert.uniqueBuyers}\n`;
  msg += `👑 *Top holder:* ${alert.topHolderPercent.toFixed(1)}%\n`;
  if (alert.lastAiScore !== null) {
    msg += `🎯 *Last AI Score:* ${alert.lastAiScore}/100\n`;
  }
  msg += `\n\`${alert.tokenAddress}\``;
  return msg;
}
