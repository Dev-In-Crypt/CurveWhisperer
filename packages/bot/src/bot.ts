import { Bot } from 'grammy';
import { startCommand } from './commands/start.js';
import { topCommand } from './commands/top.js';
import { scoreCommand } from './commands/score.js';
import { alertsCommand } from './commands/alerts.js';
import { statsCommand } from './commands/stats.js';

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // Rate limit per user
  const lastCommand = new Map<number, number>();
  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (userId) {
      const now = Date.now();
      const last = lastCommand.get(userId) || 0;
      if (now - last < 2000) return;
      lastCommand.set(userId, now);
    }
    await next();
  });

  bot.catch((err) => {
    console.error('Bot error:', err.message);
    try { err.ctx?.reply('Something went wrong.'); } catch {}
  });

  bot.command('start', startCommand);
  bot.command('top', topCommand);
  bot.command('score', scoreCommand);
  bot.command('alerts', alertsCommand);
  bot.command('stats', statsCommand);

  return bot;
}
