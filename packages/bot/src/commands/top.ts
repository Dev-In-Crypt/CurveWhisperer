import { CommandContext, Context } from 'grammy';
import { fetchCurves } from '../api-client.js';

function esc(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export async function topCommand(ctx: CommandContext<Context>): Promise<void> {
  const curves = await fetchCurves('score', 10);

  if (curves.length === 0) {
    await ctx.reply('No active curves right now\\.');
    return;
  }

  let msg = '*Top Scored Curves*\n\n';
  for (let i = 0; i < curves.length; i++) {
    const c = curves[i];
    const score = c.lastScore?.score || 0;
    const emoji = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
    msg += `${emoji} *\\#${i + 1}* ${esc(c.name)} — ${score}/100 — ${c.filledPercent.toFixed(0)}% — ${c.uniqueBuyers} buyers\n`;
  }

  await ctx.reply(msg, { parse_mode: 'MarkdownV2' });
}
