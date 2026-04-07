import { CommandContext, Context, InlineKeyboard } from 'grammy';
import { UserStore } from '@cw/backend/src/state/user-store.js';

function buildAlertKeyboard(chatId: number, userStore: UserStore): InlineKeyboard {
  const prefs = userStore.getUserPrefs(chatId);
  return new InlineKeyboard()
    .text(
      `🐋 Whale: ${prefs.alerts.whale ? 'ON ✅' : 'OFF ❌'}`,
      'toggle:whale',
    )
    .row()
    .text(
      `🎓 Graduation: ${prefs.alerts.graduation ? 'ON ✅' : 'OFF ❌'}`,
      'toggle:graduation',
    )
    .row()
    .text(
      `📊 Score: ${prefs.alerts.scoreChange ? 'ON ✅' : 'OFF ❌'}`,
      'toggle:scoreChange',
    );
}

export function createAlertsCommand(userStore: UserStore) {
  return async (ctx: CommandContext<Context>): Promise<void> => {
    const chatId = ctx.chat!.id;
    const keyboard = buildAlertKeyboard(chatId, userStore);
    await ctx.reply('*Alert Settings*\nTap to toggle:', {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    });
  };
}

export { buildAlertKeyboard };
