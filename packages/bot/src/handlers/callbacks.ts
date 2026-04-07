import { Context } from 'grammy';
import { UserStore } from '@cw/backend/src/state/user-store.js';
import { CurveStore } from '@cw/backend/src/state/curve-store.js';
import { ScoreOrchestrator } from '@cw/backend/src/analyzer/score-engine.js';
import { formatScoreCard } from '../formatters/score-card.js';
import { buildAlertKeyboard } from '../commands/alerts.js';

export function registerCallbacks(
  bot: { callbackQuery: (trigger: string | RegExp, handler: (ctx: Context) => Promise<void>) => void },
  userStore: UserStore,
  curveStore: CurveStore,
  scoreOrchestrator: ScoreOrchestrator,
): void {
  // Score detail callback
  bot.callbackQuery(/^score:(.+)$/, async (ctx: Context) => {
    const address = (ctx.callbackQuery as any)?.data?.split(':')[1];
    if (!address) return;

    await ctx.answerCallbackQuery('Loading...');

    const result = await scoreOrchestrator.scoreToken(address, 'user-request');
    const curve = curveStore.getCurve(address);

    if (!result || !curve) {
      await ctx.answerCallbackQuery('Token not found');
      return;
    }

    await ctx.reply(formatScoreCard(curve, result), { parse_mode: 'MarkdownV2' });
  });

  // Alert toggle callbacks
  bot.callbackQuery(/^toggle:(.+)$/, async (ctx: Context) => {
    const type = (ctx.callbackQuery as any)?.data?.split(':')[1] as 'whale' | 'graduation' | 'scoreChange';
    if (!type) return;

    const chatId = ctx.chat!.id;
    const newVal = userStore.toggleAlert(chatId, type);
    await ctx.answerCallbackQuery(`${type} alerts: ${newVal ? 'ON' : 'OFF'}`);

    // Update keyboard
    const keyboard = buildAlertKeyboard(chatId, userStore);
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  });
}
