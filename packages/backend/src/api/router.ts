import express from 'express';
import cors from 'cors';
import { CurveStore } from '../state/curve-store.js';
import { AlertStore } from '../state/alert-store.js';
import { createCurvesRouter } from './curves.js';
import { createAlertsRouter } from './alerts.js';
import { createStatsRouter } from './stats.js';
import { config } from '../config.js';

export function createApp(curveStore: CurveStore, alertStore: AlertStore): express.Application {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      // Allow configured origin, localhost, and Railway domains
      if (
        !origin ||
        origin === config.server.corsOrigin ||
        origin.endsWith('.up.railway.app') ||
        origin.startsWith('http://localhost')
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }));
  app.use(express.json());

  app.use('/api/curves', createCurvesRouter(curveStore, alertStore));
  app.use('/api/alerts', createAlertsRouter(alertStore));
  app.use('/api/stats', createStatsRouter(curveStore, alertStore));

  app.use(((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: err.message });
  }) as express.ErrorRequestHandler);

  return app;
}
