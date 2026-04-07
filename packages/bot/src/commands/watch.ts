import { CommandContext, Context } from 'grammy';
import { CurveStore } from '@cw/backend/src/state/curve-store.js';
import { UserStore } from '@cw/backend/src/state/user-store.js';
import { escapeMarkdown } from '../formatters/score-card.js';

export function createWatchCommand(curveStore: CurveStore, userStore: UserStore) {
  return async (ctx: CommandContext<Context>): Promise<void> => {
    const address = ctx.match?.trim();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      await ctx.reply('Usage: `/watch 0x...`', { parse_mode: 'MarkdownV2' });
      return;
    }

    const curve = curveStore.getCurve(address);
    if (!curve) {
      await ctx.reply('❌ Token not found in active curves\\.');
      return;
    }

    const chatId = ctx.chat!.id;
    const prefs = userStore.getUserPrefs(chatId);

    if (prefs.watchedTokens.has(address.toLowerCase())) {
      await ctx.reply('Already watching this token\\.');
      return;
    }

    if (prefs.watchedTokens.size >= 10) {
      await ctx.reply('❌ Max 10 watched tokens\\. Use /unwatch to remove one first\\.');
      return;
    }

    userStore.watchToken(chatId, address);
    await ctx.reply(
      `✅ Watching *${escapeMarkdown(curve.name)}*\\. You'll receive alerts for whale buys, graduations, and score changes\\.`,
      { parse_mode: 'MarkdownV2' },
    );
  };
}

export function createUnwatchCommand(userStore: UserStore) {
  return async (ctx: CommandContext<Context>): Promise<void> => {
    const address = ctx.match?.trim();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      await ctx.reply('Usage: `/unwatch 0x...`', { parse_mode: 'MarkdownV2' });
      return;
    }

    const chatId = ctx.chat!.id;
    const removed = userStore.unwatchToken(chatId, address);

    if (removed) {
      await ctx.reply('Removed from watchlist\\.');
    } else {
      await ctx.reply("You're not watching this token\\.");
    }
  };
}
