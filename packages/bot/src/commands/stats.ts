import { CommandContext, Context } from 'grammy';
import { CurveStore } from '@cw/backend/src/state/curve-store.js';
import { AlertStore } from '@cw/backend/src/state/alert-store.js';
import { escapeMarkdown } from '../formatters/score-card.js';

export function createStatsCommand(curveStore: CurveStore, alertStore: AlertStore) {
  return async (ctx: CommandContext<Context>): Promise<void> => {
    const topCurves = curveStore.getTopByScore(1);
    const topName = topCurves[0] ? escapeMarkdown(topCurves[0].name) : 'N/A';
    const topScore = topCurves[0]?.lastScore?.score || 0;

    let msg = `📊 *CurveWhisperer Stats*\n\n`;
    msg += `📈 Active Curves: ${curveStore.size}\n`;
    msg += `🎓 Graduations Today: ${alertStore.graduationsToday}\n`;
    msg += `🏆 Top Score: ${topName} \\(${topScore}/100\\)\n`;

    await ctx.reply(msg, { parse_mode: 'MarkdownV2' });
  };
}
