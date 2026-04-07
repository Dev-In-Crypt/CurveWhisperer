import { Router } from 'express';
import { CurveStore } from '../state/curve-store.js';
import { AlertStore } from '../state/alert-store.js';

export function createCurvesRouter(curveStore: CurveStore, alertStore: AlertStore): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const sortBy = (req.query.sortBy as string) || 'score';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const minFill = parseFloat(req.query.minFill as string) || 0;

    let curves = curveStore.getActiveCurves(sortBy, limit);
    if (minFill > 0) {
      curves = curves.filter(c => c.filledPercent >= minFill);
    }

    // Serialize (convert Maps to plain objects)
    const serialized = curves.map(c => ({
      ...c,
      buyerBalances: Object.fromEntries(c.buyerBalances),
    }));

    res.json({ curves: serialized, total: curveStore.size, timestamp: new Date().toISOString() });
  });

  router.get('/:address', (req, res) => {
    const address = req.params.address;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({ error: 'Invalid address format' });
      return;
    }

    const curve = curveStore.getCurve(address);
    if (!curve) {
      res.status(404).json({ error: 'Token not found in active curves' });
      return;
    }

    const alerts = alertStore.getByToken(address, 20);

    res.json({
      curve: { ...curve, buyerBalances: Object.fromEntries(curve.buyerBalances) },
      alerts,
    });
  });

  return router;
}
