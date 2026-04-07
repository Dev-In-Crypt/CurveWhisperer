import { CurveStore } from '../state/curve-store.js';
import { AlertStore } from '../state/alert-store.js';
import { WhaleAlert, GraduationAlert, TradeEvent } from '../utils/types.js';
import { calculateRuleBasedScore } from '../analyzer/rule-engine.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('mock-data');

const MOCK_TOKENS = [
  { name: 'PepeChain', symbol: 'PEPEC', fill: 87, bnb: 15.66, buyers: 142, velocity: 4.2, trend: 'accelerating' as const },
  { name: 'BNBDoge', symbol: 'BDOGE', fill: 73, bnb: 13.14, buyers: 89, velocity: 2.8, trend: 'stable' as const },
  { name: 'MoonRocket', symbol: 'MRKT', fill: 62, bnb: 11.16, buyers: 67, velocity: 1.5, trend: 'decelerating' as const },
  { name: 'ChadCoin', symbol: 'CHAD', fill: 54, bnb: 9.72, buyers: 53, velocity: 3.1, trend: 'accelerating' as const },
  { name: 'Based AI', symbol: 'BASEDAI', fill: 48, bnb: 8.64, buyers: 44, velocity: 1.9, trend: 'stable' as const },
  { name: 'FourMemeGod', symbol: '4GOD', fill: 41, bnb: 7.38, buyers: 38, velocity: 0.8, trend: 'decelerating' as const },
  { name: 'DeFi Frog', symbol: 'DFROG', fill: 35, bnb: 6.30, buyers: 31, velocity: 2.4, trend: 'accelerating' as const },
  { name: 'ShibaBNB', symbol: 'SBNB', fill: 28, bnb: 5.04, buyers: 26, velocity: 1.1, trend: 'stable' as const },
  { name: 'NeonApe', symbol: 'NAPE', fill: 22, bnb: 3.96, buyers: 19, velocity: 0.5, trend: 'stalled' as const },
  { name: 'BSC Wizard', symbol: 'BSCW', fill: 15, bnb: 2.70, buyers: 14, velocity: 0.3, trend: 'decelerating' as const },
  { name: 'GigaBull', symbol: 'GIGA', fill: 9, bnb: 1.62, buyers: 8, velocity: 0.7, trend: 'stable' as const },
  { name: 'MemeKing', symbol: 'MKING', fill: 5, bnb: 0.90, buyers: 5, velocity: 0.2, trend: 'stalled' as const },
];

function randomAddr(): string {
  const hex = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
  return addr;
}

export function seedMockData(curveStore: CurveStore, alertStore: AlertStore): void {
  log.info('Seeding mock data for demo mode...');

  for (const token of MOCK_TOKENS) {
    const address = randomAddr();
    const createdAt = Date.now() - Math.floor(Math.random() * 4 * 60 * 60 * 1000); // 0-4 hours ago

    const state = curveStore.addCurve(address, token.name, token.symbol, createdAt);

    // Generate fake buyers
    const buyerCount = token.buyers;
    const bnbPerBuyer = token.bnb / buyerCount;

    for (let i = 0; i < Math.min(buyerCount, 30); i++) {
      // Vary amounts — some bigger, some smaller
      const multiplier = i < 3 ? 3 : i < 8 ? 1.5 : 0.7;
      const trade: TradeEvent = {
        tokenAddress: address,
        buyer: randomAddr(),
        bnbAmount: bnbPerBuyer * multiplier * (0.5 + Math.random()),
        tokenAmount: 1000000,
        direction: 'buy',
        txHash: '0x' + Math.random().toString(16).slice(2),
        blockNumber: 0,
        timestamp: createdAt + i * 60000,
      };
      curveStore.updateCurve(address, trade);
    }

    // Override velocity trend (trades are too close together for natural calc)
    const curve = curveStore.getCurve(address);
    if (curve) {
      curve.velocityTrend = token.trend;
      curve.velocity = token.velocity;

      // Score with rule engine
      const score = calculateRuleBasedScore(curve);
      score.source = 'llm'; // pretend it's from AI for demo
      score.confidence = score.score >= 60 ? 'high' : score.score >= 30 ? 'medium' : 'low';
      curveStore.updateScore(address, score);
    }
  }

  // Add some mock whale alerts
  const curves = curveStore.getActiveCurves('score', 5);
  for (const c of curves.slice(0, 3)) {
    alertStore.addAlert({
      id: `whale_mock_${Math.random().toString(36).slice(2, 8)}`,
      tokenAddress: c.address,
      tokenName: c.name,
      alertType: 'large_buy',
      details: `${(1 + Math.random() * 3).toFixed(2)} BNB buy by ${randomAddr().slice(0, 10)}...`,
      severity: Math.random() > 0.5 ? 'high' : 'medium',
      timestamp: Date.now() - Math.floor(Math.random() * 30 * 60 * 1000),
    } as WhaleAlert);
  }

  // Add a mock graduation
  alertStore.addAlert({
    id: `grad_mock_1`,
    tokenAddress: randomAddr(),
    name: 'ElonCat',
    symbol: 'ECAT',
    timeToGraduate: '1h 47m',
    totalBnb: 18.2,
    uniqueBuyers: 203,
    topHolderPercent: 4.2,
    lastAiScore: 92,
    timestamp: Date.now() - 15 * 60 * 1000,
  } as GraduationAlert);

  log.info({ tokens: MOCK_TOKENS.length }, 'Mock data seeded');
}

export function startMockUpdates(curveStore: CurveStore, alertStore: AlertStore): void {
  // Simulate live trades every 3-8 seconds
  setInterval(() => {
    const curves = curveStore.getActiveCurves('newest', 50);
    if (curves.length === 0) return;

    const curve = curves[Math.floor(Math.random() * curves.length)];
    const bnb = 0.01 + Math.random() * 0.3;

    const trade: TradeEvent = {
      tokenAddress: curve.address,
      buyer: randomAddr(),
      bnbAmount: bnb,
      tokenAmount: bnb * 50000000,
      direction: 'buy',
      txHash: '0x' + Math.random().toString(16).slice(2),
      blockNumber: 0,
      timestamp: Date.now(),
    };

    curveStore.updateCurve(curve.address, trade);
  }, 3000 + Math.random() * 5000);

  // Simulate occasional whale alerts
  setInterval(() => {
    const curves = curveStore.getActiveCurves('fill', 10);
    if (curves.length === 0) return;
    const curve = curves[Math.floor(Math.random() * curves.length)];

    alertStore.addAlert({
      id: `whale_live_${Date.now()}`,
      tokenAddress: curve.address,
      tokenName: curve.name,
      alertType: Math.random() > 0.7 ? 'concentration' : 'large_buy',
      details: `${(0.5 + Math.random() * 2.5).toFixed(2)} BNB by ${randomAddr().slice(0, 10)}...`,
      severity: Math.random() > 0.6 ? 'high' : 'medium',
      timestamp: Date.now(),
    } as WhaleAlert);
  }, 15000 + Math.random() * 30000);
}
