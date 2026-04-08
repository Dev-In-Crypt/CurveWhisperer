import { CommandContext, Context } from 'grammy';
import { fetchStats } from '../api-client.js';

function esc(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export async function statsCommand(ctx: CommandContext<Context>): Promise<void> {
  const stats = await fetchStats();

  if (!stats) {
    await ctx.reply('Backend unavailable\\. Try again later\\.');
    return;
  }

  const topName = stats.topScore ? esc(stats.topScore.name) : 'N/A';
  const topScore = stats.topScore?.score || 0;

  let msg = `*CurveWhisperer Stats*\n\n`;
  msg += `Active Curves: ${stats.activeCurves}\n`;
  msg += `Graduations Today: ${stats.graduationsToday}\n`;
  msg += `Top Score: ${topName} \\(${topScore}/100\\)`;

  await ctx.reply(msg, { parse_mode: 'MarkdownV2' });
}
