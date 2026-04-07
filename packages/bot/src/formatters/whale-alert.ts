import { WhaleAlert } from '@cw/backend/src/utils/types.js';
import { escapeMarkdown } from './score-card.js';

const severityBadge: Record<string, string> = {
  low: '🟡',
  medium: '🟠',
  high: '🔴',
};

export function formatWhaleAlert(alert: WhaleAlert): string {
  const badge = severityBadge[alert.severity] || '⚪';
  let msg = `🐋 *Whale Alert* — ${escapeMarkdown(alert.tokenName)}\n\n`;
  msg += `${badge} *Type:* ${escapeMarkdown(alert.alertType.replace(/_/g, ' '))}\n`;
  msg += `📝 ${escapeMarkdown(alert.details)}\n`;
  msg += `⚠️ *Severity:* ${alert.severity}\n`;
  msg += `\`${alert.tokenAddress}\``;
  return msg;
}
