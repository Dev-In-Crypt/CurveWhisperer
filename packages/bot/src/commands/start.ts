import { CommandContext, Context, InlineKeyboard } from 'grammy';

export async function startCommand(ctx: CommandContext<Context>): Promise<void> {
  const keyboard = new InlineKeyboard()
    .url('🌐 Open Dashboard', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

  await ctx.reply(
    `👋 *Welcome to CurveWhisperer\\!*\n\n` +
    `AI\\-powered graduation advisor for Four\\.Meme bonding curves on BNB Chain\\.\n\n` +
    `• 🎯 Real\\-time AI graduation scores \\(0\\-100\\)\n` +
    `• 🐋 Whale alerts & concentration warnings\n` +
    `• 🎓 Instant graduation notifications\n\n` +
    `*Commands:*\n` +
    `/top — Top scored curves\n` +
    `/score \\<address\\> — AI score for a token\n` +
    `/watch \\<address\\> — Watch a token\n` +
    `/unwatch \\<address\\> — Stop watching\n` +
    `/alerts — Toggle alert types\n` +
    `/stats — Platform stats`,
    { parse_mode: 'MarkdownV2', reply_markup: keyboard },
  );
}
