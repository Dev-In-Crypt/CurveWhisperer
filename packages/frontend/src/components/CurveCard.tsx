'use client';

import Link from 'next/link';
import { CurveData } from '../lib/api';
import { ScoreBadge } from './ScoreBadge';

function trendArrow(trend: string): string {
  switch (trend) {
    case 'accelerating': return '▲';
    case 'decelerating': return '▼';
    case 'stalled': return '◼';
    default: return '►';
  }
}

function trendColor(trend: string): string {
  switch (trend) {
    case 'accelerating': return 'text-accent-green';
    case 'decelerating': return 'text-accent-red';
    case 'stalled': return 'text-accent-red/50';
    default: return 'text-muted';
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function scoreGlowClass(score: number): string {
  if (score >= 70) return 'glow-green';
  if (score >= 40) return 'glow-yellow';
  if (score > 0) return 'glow-red';
  return '';
}

export function CurveCard({ curve }: { curve: CurveData }) {
  const score = curve.lastScore?.score || 0;
  const fillWidth = Math.min(curve.filledPercent, 100);

  return (
    <Link href={`/token/${curve.address}`}>
      <div className={`glow-card rounded-xl p-4 cursor-pointer group ${scoreGlowClass(score)}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold truncate group-hover:text-accent-cyan transition-colors">
              {curve.name}
            </h3>
            <p className="text-xs text-muted font-mono">{curve.symbol}</p>
          </div>
          <ScoreBadge score={score} size="sm" />
        </div>

        {/* Fill bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted font-mono mb-1">
            <span>{curve.filledPercent.toFixed(1)}%</span>
            <span>{curve.totalBnb.toFixed(2)} BNB</span>
          </div>
          <div className="h-1.5 bg-card-border/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full shimmer-bar transition-all duration-700"
              style={{ width: `${fillWidth}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className={trendColor(curve.velocityTrend)}>
            {trendArrow(curve.velocityTrend)} {curve.velocity.toFixed(2)} BNB/hr
          </span>
          <span className="text-accent-purple/70">{curve.uniqueBuyers} buyers</span>
          <span className="text-muted">{relativeTime(curve.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
