'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { AlertData } from '../lib/api';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export function LiveFeed() {
  const { messages } = useWebSocket(['whale-alerts', 'graduations']);
  const [feed, setFeed] = useState<AlertData[]>([]);

  useEffect(() => {
    const whale = messages.get('whale-alerts') as AlertData | undefined;
    if (whale?.id) {
      setFeed(prev => {
        if (prev.some(a => a.id === whale.id)) return prev;
        return [whale, ...prev].slice(0, 50);
      });
    }
  }, [messages]);

  useEffect(() => {
    const grad = messages.get('graduations') as AlertData | undefined;
    if (grad?.id) {
      setFeed(prev => {
        if (prev.some(a => a.id === grad.id)) return prev;
        return [grad, ...prev].slice(0, 50);
      });
    }
  }, [messages]);

  if (feed.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-8 font-mono">
        <div className="text-accent-cyan/30 text-2xl mb-2">⟨⟩</div>
        Awaiting signals...
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto stagger">
      {feed.map((item) => {
        const isGrad = 'timeToGraduate' in item;
        return (
          <div
            key={item.id}
            className={`glow-card rounded-lg px-3 py-2 text-sm ${isGrad ? 'border-accent-green/20' : 'border-accent-red/20'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-lg ${isGrad ? 'neon-text-subtle text-accent-green' : ''}`}>
                {isGrad ? '🎓' : '🐋'}
              </span>
              <span className="font-mono font-medium truncate text-foreground">
                {item.tokenName || item.name || item.tokenAddress?.slice(0, 10)}
              </span>
              <span className="text-xs text-muted font-mono ml-auto">{relativeTime(item.timestamp)}</span>
            </div>
            {item.details && (
              <p className="text-xs text-muted mt-1 truncate font-mono">{item.details}</p>
            )}
            {item.timeToGraduate && (
              <p className="text-xs text-accent-green mt-1 font-mono neon-text-subtle">
                Graduated in {item.timeToGraduate}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
