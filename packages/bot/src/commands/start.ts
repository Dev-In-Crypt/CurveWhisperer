import { CommandContext, Context, InlineKeyboard } from 'grammy';

export async function startCommand(ctx: CommandContext<Context>): Promise<void> {
  const keyboard = new InlineKeyboard()
    .url('Open Dashboard', process.env.FRONTEND_URL || 'https://cwfrontend-production.up.railway.app');

  await ctx.reply(
    `Welcome to *CurveWhisperer*\\!\n\n` +
    `AI\\-powered graduation advisor for Four\\.Meme bonding curves on BNB Chain\\.\n\n` +
    `*Commands:*\n` +
    `/top \\- Top scored curves\n` +
    `/score \\<address\\> \\- AI score for a token\n` +
    `/alerts \\- Recent alerts\n` +
    `/stats \\- Platform stats`,
    { parse_mode: 'MarkdownV2', reply_markup: keyboard },
  );
}
