import { Bot } from 'grammy';
import { CurveStore } from '@cw/backend/src/state/curve-store.js';
import { AlertStore } from '@cw/backend/src/state/alert-store.js';
import { UserStore } from '@cw/backend/src/state/user-store.js';
import { ScoreOrchestrator } from '@cw/backend/src/analyzer/score-engine.js';
import { startCommand } from './commands/start.js';
import { createTopCommand } from './commands/top.js';
import { createScoreCommand } from './commands/score.js';
import { createWatchCommand, createUnwatchCommand } from './commands/watch.js';
import { createAlertsCommand } from './commands/alerts.js';
import { createStatsCommand } from './commands/stats.js';
import { registerCallbacks } from './handlers/callbacks.js';

export function createBot(
  token: string,
  curveStore: CurveStore,
  alertStore: AlertStore,
  userStore: UserStore,
  scoreOrchestrator: ScoreOrchestrator,
): Bot {
  const bot = new Bot(token);

  // Rate limit: track last command time per user
  const lastCommand = new Map<number, number>();
  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (userId) {
      const now = Date.now();
      const last = lastCommand.get(userId) || 0;
      if (now - last < 2000) return; // Drop if < 2s since last command
      lastCommand.set(userId, now);
    }
    await next();
  });

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err.message);
    try {
      err.ctx?.reply('Something went wrong. Please try again.');
    } catch { /* ignore */ }
  });

  // Register commands
  bot.command('start', startCommand);
  bot.command('top', createTopCommand(curveStore));
  bot.command('score', createScoreCommand(curveStore, scoreOrchestrator));
  bot.command('watch', createWatchCommand(curveStore, userStore));
  bot.command('unwatch', createUnwatchCommand(userStore));
  bot.command('alerts', createAlertsCommand(userStore));
  bot.command('stats', createStatsCommand(curveStore, alertStore));

  // Register callback handlers
  registerCallbacks(bot, userStore, curveStore, scoreOrchestrator);

  return bot;
}
