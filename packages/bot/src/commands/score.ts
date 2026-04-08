import { CommandContext, Context } from 'grammy';
import { fetchCurve } from '../api-client.js';

function esc(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
}

export async function scoreCommand(ctx: CommandContext<Context>): Promise<void> {
  const address = ctx.match?.trim();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    await ctx.reply('Usage: `/score 0x\\.\\.\\.` \\(token address\\)', { parse_mode: 'MarkdownV2' });
    return;
  }

  const placeholder = await ctx.reply('Analyzing\\.\\.\\.');

  const curve = await fetchCurve(address);
  if (!curve) {
    await ctx.api.editMessageText(ctx.chat!.id, placeholder.message_id, 'Token not found in active curves\\.');
    return;
  }

  const s = curve.lastScore;
  let msg = `*${esc(curve.name)}* \\(${esc(curve.symbol)}\\)\n\n`;

  if (s) {
    const emoji = s.score >= 70 ? '🟢' : s.score >= 40 ? '🟡' : '🔴';
    msg += `${emoji} \`${scoreBar(s.score)} ${s.score}/100\`\n\n`;
    msg += `Fill: ${curve.filledPercent.toFixed(1)}% \\(${curve.totalBnb.toFixed(3)} BNB\\)\n`;
    msg += `Velocity: ${curve.velocity.toFixed(2)} BNB/hr \\(${esc(curve.velocityTrend)}\\)\n`;
    msg += `Buyers: ${curve.uniqueBuyers}\n`;
    msg += `Confidence: ${s.confidence}\n\n`;
    msg += `_${esc(s.reasoning)}_`;
  } else {
    msg += `Fill: ${curve.filledPercent.toFixed(1)}%\nBuyers: ${curve.uniqueBuyers}\n\n_No AI score yet\\._`;
  }

  await ctx.api.editMessageText(ctx.chat!.id, placeholder.message_id, msg, { parse_mode: 'MarkdownV2' });
}
