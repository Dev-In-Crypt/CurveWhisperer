'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchCurves, CurveData } from '../lib/api';
import { useWebSocket } from './useWebSocket';

export function useCurves(sortBy: string = 'score') {
  const [curves, setCurves] = useState<CurveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, messages } = useWebSocket(['curve-updates', 'scores']);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCurves({ sortBy, limit: 100 });
    if (data) {
      setCurves(data.curves);
      setError(null);
    } else {
      setError('Failed to load curves');
    }
    setLoading(false);
  }, [sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  // Merge WS updates
  useEffect(() => {
    const update = messages.get('curve-updates') as Partial<CurveData> | undefined;
    if (!update?.address) return;

    setCurves(prev => {
      const idx = prev.findIndex(c => c.address === update.address);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...update };
      return next;
    });
  }, [messages]);

  return { curves, loading, error, connected, refresh: load };
}
