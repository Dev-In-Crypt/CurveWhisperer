import { Router } from 'express';
import { AlertStore } from '../state/alert-store.js';

export function createAlertsRouter(alertStore: AlertStore): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const type = req.query.type as string || 'all';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    let alerts;
    if (type === 'whale') {
      alerts = alertStore.getByType('whale', limit);
    } else if (type === 'graduation') {
      alerts = alertStore.getByType('graduation', limit);
    } else {
      alerts = alertStore.getRecent(limit);
    }

    res.json({ alerts });
  });

  return router;
}
