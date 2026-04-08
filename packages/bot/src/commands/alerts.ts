import { CommandContext, Context } from 'grammy';
import { fetchAlerts } from '../api-client.js';

function esc(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export async function alertsCommand(ctx: CommandContext<Context>): Promise<void> {
  const alerts = await fetchAlerts(10);

  if (alerts.length === 0) {
    await ctx.reply('No recent alerts\\.');
    return;
  }

  let msg = '*Recent Alerts*\n\n';
  for (const a of alerts) {
    const icon = a.alertType ? '🐋' : '🎓';
    const name = a.tokenName || a.name || a.tokenAddress?.slice(0, 10) || '?';
    const detail = a.details || (a.timeToGraduate ? `Graduated in ${a.timeToGraduate}` : '');
    msg += `${icon} *${esc(name)}*`;
    if (a.severity) msg += ` \\[${a.severity}\\]`;
    msg += `\n${esc(detail)}\n\n`;
  }

  await ctx.reply(msg, { parse_mode: 'MarkdownV2' });
}
