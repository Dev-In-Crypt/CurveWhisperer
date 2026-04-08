import { createBot } from './bot.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = createBot(token);

bot.start({
  onStart: () => console.log('CurveWhisperer Telegram bot started'),
});

process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  bot.stop();
  process.exit(0);
});
