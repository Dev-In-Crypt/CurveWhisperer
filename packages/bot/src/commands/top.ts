import { CommandContext, Context, InlineKeyboard } from 'grammy';
import { CurveStore } from '@cw/backend/src/state/curve-store.js';
import { escapeMarkdown } from '../formatters/score-card.js';

export function createTopCommand(curveStore: CurveStore) {
  return async (ctx: CommandContext<Context>): Promise<void> => {
    const curves = curveStore.getTopByScore(10);

    if (curves.length === 0) {
      await ctx.reply('No active curves right now\\. Check back later\\!', { parse_mode: 'MarkdownV2' });
      return;
    }

    let msg = '🏆 *Top Scored Curves*\n\n';
    const keyboard = new InlineKeyboard();

    curves.forEach((c, i) => {
      const score = c.lastScore?.score || 0;
      const emoji = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
      msg += `${emoji} *\\#${i + 1}* ${escapeMarkdown(c.name)} — 🎯 ${score}/100 — 📊 ${c.filledPercent.toFixed(0)}% — 👥 ${c.uniqueBuyers}\n`;

      if (i < 5) {
        keyboard.text(`#${i + 1} ${c.name.slice(0, 12)}`, `score:${c.address}`);
        if ((i + 1) % 2 === 0) keyboard.row();
      }
    });

    await ctx.reply(msg, { parse_mode: 'MarkdownV2', reply_markup: keyboard });
  };
}
