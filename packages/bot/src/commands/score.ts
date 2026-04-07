import { CommandContext, Context } from 'grammy';
import { ScoreOrchestrator } from '@cw/backend/src/analyzer/score-engine.js';
import { CurveStore } from '@cw/backend/src/state/curve-store.js';
import { formatScoreCard } from '../formatters/score-card.js';

export function createScoreCommand(curveStore: CurveStore, scoreOrchestrator: ScoreOrchestrator) {
  return async (ctx: CommandContext<Context>): Promise<void> => {
    const address = ctx.match?.trim();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      await ctx.reply('Usage: `/score 0x...` \\(token address\\)', { parse_mode: 'MarkdownV2' });
      return;
    }

    const placeholder = await ctx.reply('🔍 Analyzing\\.\\.\\.');

    const result = await scoreOrchestrator.scoreToken(address, 'user-request');
    const curve = curveStore.getCurve(address);

    if (!result || !curve) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        placeholder.message_id,
        '❌ Token not found in active curves\\.',
        { parse_mode: 'MarkdownV2' },
      );
      return;
    }

    await ctx.api.editMessageText(
      ctx.chat!.id,
      placeholder.message_id,
      formatScoreCard(curve, result),
      { parse_mode: 'MarkdownV2' },
    );
  };
}
