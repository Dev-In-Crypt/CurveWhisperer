import http from 'http';
import { config } from './config.js';
import { createChildLogger } from './utils/logger.js';
import { BitqueryClient } from './utils/bitquery.js';
import { initProvider, initWallet } from './utils/bsc-rpc.js';
import { CurveStore } from './state/curve-store.js';
import { AlertStore } from './state/alert-store.js';
import { UserStore } from './state/user-store.js';
import { BondingMonitor } from './collector/bonding-monitor.js';
import { WhaleDetector } from './collector/whale-detector.js';
import { GraduationWatcher } from './collector/graduation-watcher.js';
import { ScoreOrchestrator } from './analyzer/score-engine.js';
import { ScoreCache } from './analyzer/cache.js';
import { OnchainPublisher } from './publisher/onchain.js';
import { WSPublisher } from './publisher/websocket.js';
import { createApp } from './api/router.js';
import { seedMockData, startMockUpdates } from './collector/mock-data.js';

const log = createChildLogger('main');

const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1';

// --- State ---
export const curveStore = new CurveStore();
export const alertStore = new AlertStore();
export const userStore = new UserStore();

// --- Infra ---
const bitquery = new BitqueryClient(
  config.bitquery.apiKey,
  config.bitquery.httpUrl,
  config.bitquery.wsUrl,
);

initProvider();
initWallet();

// --- Collectors ---
const whaleDetector = new WhaleDetector(curveStore);
const bondingMonitor = new BondingMonitor(bitquery, curveStore);
const graduationWatcher = new GraduationWatcher(bitquery, curveStore);

// --- Express + WS ---
const app = createApp(curveStore, alertStore);
const server = http.createServer(app);
const wsPublisher = new WSPublisher(server);

// --- AI Scoring ---
const scoreCache = new ScoreCache();
const onchainPublisher = new OnchainPublisher();
export const scoreOrchestrator = new ScoreOrchestrator(
  curveStore, scoreCache, onchainPublisher, wsPublisher,
);

// --- Wire events ---

// Trades → whale detection
bondingMonitor.on('trade', (trade) => {
  const alert = whaleDetector.analyzeTrade(trade);
  if (alert) {
    alertStore.addAlert(alert);
    wsPublisher.broadcast('whale-alerts', alert);
  }
});

// Trades → curve updates via WS
curveStore.on('curve:updated', (state) => {
  wsPublisher.broadcast('curve-updates', {
    address: state.address,
    name: state.name,
    symbol: state.symbol,
    filledPercent: state.filledPercent,
    totalBnb: state.totalBnb,
    velocity: state.velocity,
    velocityTrend: state.velocityTrend,
    uniqueBuyers: state.uniqueBuyers,
    hhi: state.hhi,
    lastScore: state.lastScore,
  }, state.address);
});

// Fill threshold → trigger scoring
bondingMonitor.on('score:trigger', (address: string) => {
  scoreOrchestrator.scoreToken(address, 'fill-threshold');
});

// Whale alert → re-score
whaleDetector.on('whale:alert', (alert) => {
  scoreCache.invalidate(alert.tokenAddress);
  scoreOrchestrator.scoreToken(alert.tokenAddress, 'whale-alert');
});

// Graduation → store + broadcast
graduationWatcher.on('graduation:alert', (alert) => {
  alertStore.addAlert(alert);
  wsPublisher.broadcast('graduations', alert);
  userStore.removeTokenFromAll(alert.tokenAddress);
});

// --- Export for bot ---
export { whaleDetector, graduationWatcher, scoreCache };

// --- Start ---
server.listen(config.server.port, () => {
  log.info({ port: config.server.port, demoMode: DEMO_MODE }, 'CurveWhisperer backend running');

  if (DEMO_MODE) {
    log.info('DEMO MODE: seeding mock data and simulating live trades');
    seedMockData(curveStore, alertStore);
    startMockUpdates(curveStore, alertStore);
  } else {
    bondingMonitor.start();
    graduationWatcher.start();
  }

  scoreOrchestrator.startPeriodicScoring();
  log.info('All services started');
});

// Graceful shutdown
process.on('SIGINT', () => {
  log.info('Shutting down...');
  bondingMonitor.stop();
  graduationWatcher.stop();
  scoreOrchestrator.stop();
  bitquery.disconnect();
  server.close();
  process.exit(0);
});
