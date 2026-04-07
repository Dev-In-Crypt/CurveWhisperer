import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('user-store');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../../data/users.json');

export interface UserPrefs {
  watchedTokens: Set<string>;
  alerts: {
    whale: boolean;
    graduation: boolean;
    scoreChange: boolean;
  };
}

interface SerializedUserPrefs {
  watchedTokens: string[];
  alerts: { whale: boolean; graduation: boolean; scoreChange: boolean };
}

export class UserStore {
  private users = new Map<number, UserPrefs>();

  constructor() {
    this.load();
  }

  getUserPrefs(chatId: number): UserPrefs {
    if (!this.users.has(chatId)) {
      this.users.set(chatId, {
        watchedTokens: new Set(),
        alerts: { whale: true, graduation: true, scoreChange: true },
      });
    }
    return this.users.get(chatId)!;
  }

  watchToken(chatId: number, address: string): boolean {
    const prefs = this.getUserPrefs(chatId);
    const key = address.toLowerCase();
    if (prefs.watchedTokens.size >= 10) return false;
    if (prefs.watchedTokens.has(key)) return true;
    prefs.watchedTokens.add(key);
    this.persist();
    return true;
  }

  unwatchToken(chatId: number, address: string): boolean {
    const prefs = this.getUserPrefs(chatId);
    const key = address.toLowerCase();
    const existed = prefs.watchedTokens.has(key);
    prefs.watchedTokens.delete(key);
    if (existed) this.persist();
    return existed;
  }

  removeTokenFromAll(address: string): void {
    const key = address.toLowerCase();
    for (const prefs of this.users.values()) {
      prefs.watchedTokens.delete(key);
    }
    this.persist();
  }

  getWatchers(tokenAddress: string): number[] {
    const key = tokenAddress.toLowerCase();
    const watchers: number[] = [];
    for (const [chatId, prefs] of this.users) {
      if (prefs.watchedTokens.has(key)) {
        watchers.push(chatId);
      }
    }
    return watchers;
  }

  toggleAlert(chatId: number, type: 'whale' | 'graduation' | 'scoreChange'): boolean {
    const prefs = this.getUserPrefs(chatId);
    prefs.alerts[type] = !prefs.alerts[type];
    this.persist();
    return prefs.alerts[type];
  }

  private persist(): void {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const data: Record<string, SerializedUserPrefs> = {};
      for (const [chatId, prefs] of this.users) {
        data[chatId.toString()] = {
          watchedTokens: Array.from(prefs.watchedTokens),
          alerts: prefs.alerts,
        };
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      log.error({ err }, 'Failed to persist user data');
    }
  }

  private load(): void {
    try {
      if (!fs.existsSync(DATA_FILE)) return;
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Record<string, SerializedUserPrefs>;
      for (const [id, prefs] of Object.entries(raw)) {
        this.users.set(parseInt(id, 10), {
          watchedTokens: new Set(prefs.watchedTokens),
          alerts: prefs.alerts,
        });
      }
      log.info({ users: this.users.size }, 'Loaded user data');
    } catch (err) {
      log.error({ err }, 'Failed to load user data');
    }
  }
}
