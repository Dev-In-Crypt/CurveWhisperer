import {
  curveStore, alertStore, userStore,
  scoreOrchestrator, whaleDetector, graduationWatcher,
} from '@cw/backend/src/index.js';
import { config } from '@cw/backend/src/config.js';
import { createBot } from './bot.js';
import { formatWhaleAlert } from './formatters/whale-alert.js';
import { formatGraduationAlert } from './formatters/graduation-alert.js';
import { escapeMarkdown } from './formatters/score-card.js';
import { WhaleAlert, GraduationAlert, ScoreResult } from '@cw/backend/src/utils/types.js';

const bot = createBot(
  config.telegram.botToken,
  curveStore,
  alertStore,
  userStore,
  scoreOrchestrator,
);

// --- Alert delivery ---
const sendQueue: Array<{ chatId: number; text: string }> = [];
let sendingActive = false;

async function processSendQueue(): Promise<void> {
  if (sendingActive) return;
  sendingActive = true;

  while (sendQueue.length > 0) {
    const item = sendQueue.shift()!;
    try {
      await bot.api.sendMessage(item.chatId, item.text, { parse_mode: 'MarkdownV2' });
    } catch (err: any) {
      if (err?.error_code === 429) {
        sendQueue.unshift(item); // Put back
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      console.error(`Failed to send to ${item.chatId}:`, err.message);
    }
    await new Promise(r => setTimeout(r, 35)); // 35ms between messages
  }

  sendingActive = false;
}

function queueMessage(chatId: number, text: string): void {
  sendQueue.push({ chatId, text });
  processSendQueue();
}

// Whale alerts
whaleDetector.on('whale:alert', (alert: WhaleAlert) => {
  const watchers = userStore.getWatchers(alert.tokenAddress);
  const text = formatWhaleAlert(alert);
  for (const chatId of watchers) {
    const prefs = userStore.getUserPrefs(chatId);
    if (prefs.alerts.whale) {
      queueMessage(chatId, text);
    }
  }
});

// Graduation alerts
graduationWatcher.on('graduation:alert', (alert: GraduationAlert) => {
  const watchers = userStore.getWatchers(alert.tokenAddress);
  const text = formatGraduationAlert(alert);
  for (const chatId of watchers) {
    const prefs = userStore.getUserPrefs(chatId);
    if (prefs.alerts.graduation) {
      queueMessage(chatId, text);
    }
  }
});

// Score change alerts
scoreOrchestrator.on('score:significant-change', (address: string, score: ScoreResult, prevScore: number) => {
  const watchers = userStore.getWatchers(address);
  const curve = curveStore.getCurve(address);
  if (!curve) return;

  const name = escapeMarkdown(curve.name);
  const text = `📊 *Score Changed* — ${name}\n\n🎯 ${prevScore} → *${score.score}*/100`;

  for (const chatId of watchers) {
    const prefs = userStore.getUserPrefs(chatId);
    if (prefs.alerts.scoreChange) {
      queueMessage(chatId, text);
    }
  }
});

// Start bot
bot.start({
  onStart: () => console.log('Telegram bot started'),
});
