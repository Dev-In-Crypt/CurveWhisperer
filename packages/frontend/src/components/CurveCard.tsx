'use client';

import Link from 'next/link';
import { CurveData } from '../lib/api';
import { ScoreBadge } from './ScoreBadge';

function trendArrow(trend: string): string {
  switch (trend) {
    case 'accelerating': return '↑';
    case 'decelerating': return '↓';
    case 'stalled': return '⏸';
    default: return '→';
  }
}

function trendColor(trend: string): string {
  switch (trend) {
    case 'accelerating': return 'text-accent-green';
    case 'decelerating': return 'text-accent-red';
    case 'stalled': return 'text-accent-red';
    default: return 'text-muted';
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CurveCard({ curve }: { curve: CurveData }) {
  const score = curve.lastScore?.score || 0;
  const fillWidth = Math.min(curve.filledPercent, 100);

  return (
    <Link href={`/token/${curve.address}`}>
      <div className="bg-card border border-card-border rounded-xl p-4 hover:border-accent-blue/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{curve.name}</h3>
            <p className="text-xs text-muted">{curve.symbol}</p>
          </div>
          <ScoreBadge score={score} size="sm" />
        </div>

        {/* Fill bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>{curve.filledPercent.toFixed(1)}%</span>
            <span>{curve.totalBnb.toFixed(2)} BNB</span>
          </div>
          <div className="h-2 bg-card-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-green transition-all duration-500"
              style={{ width: `${fillWidth}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span className={trendColor(curve.velocityTrend)}>
            {trendArrow(curve.velocityTrend)} {curve.velocity.toFixed(2)} BNB/hr
          </span>
          <span>👥 {curve.uniqueBuyers}</span>
          <span>{relativeTime(curve.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
