import { Router } from 'express';
import { CurveStore } from '../state/curve-store.js';
import { AlertStore } from '../state/alert-store.js';

export function createStatsRouter(curveStore: CurveStore, alertStore: AlertStore): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const topCurves = curveStore.getTopByScore(1);
    const topScore = topCurves[0]
      ? { name: topCurves[0].name, score: topCurves[0].lastScore?.score || 0, address: topCurves[0].address }
      : null;

    res.json({
      activeCurves: curveStore.size,
      graduationsToday: alertStore.graduationsToday,
      topScore,
    });
  });

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      activeCurves: curveStore.size,
    });
  });

  return router;
}
