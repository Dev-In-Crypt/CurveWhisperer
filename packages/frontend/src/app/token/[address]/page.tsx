'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchCurveDetail, CurveData, AlertData } from '../../../lib/api';
import { BSC_EXPLORER } from '../../../lib/constants';
import { ScoreBadge } from '../../../components/ScoreBadge';
import { CurveChart } from '../../../components/CurveChart';
import { HolderPie } from '../../../components/HolderPie';
import { WalletHoldings } from '../../../components/WalletHoldings';

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const [curve, setCurve] = useState<CurveData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchCurveDetail(address);
      if (data) {
        setCurve(data.curve);
        setAlerts(data.alerts);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 glow-card rounded w-1/3" />
          <div className="h-64 glow-card rounded border-pulse" />
          <div className="h-48 glow-card rounded border-pulse" />
        </div>
      </div>
    );
  }

  if (!curve) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center font-mono">
        <div className="text-4xl text-accent-red/30 mb-4">⊘</div>
        <p className="text-muted mb-4">Token not found in active curves.</p>
        <Link href="/" className="text-accent-cyan hover:underline">{'<'} Back to Dashboard</Link>
      </div>
    );
  }

  const score = curve.lastScore;
  const chartData = [{ time: 'now', fill: curve.filledPercent }];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-up">
      {/* Back link */}
      <Link href="/" className="text-sm text-muted hover:text-accent-cyan transition-colors font-mono">
        {'<'} dashboard
      </Link>

      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-accent-cyan neon-text-subtle">{curve.name}</span>
            {' '}
            <span className="text-muted font-normal font-mono">({curve.symbol})</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs text-accent-purple/70 glow-card px-2 py-1 rounded font-mono">
              {address}
            </code>
            <button
              onClick={copyAddress}
              className="text-xs text-accent-cyan hover:text-accent-cyan/80 font-mono transition-colors"
            >
              {copied ? '✓ copied' : 'copy'}
            </button>
            <a
              href={`${BSC_EXPLORER}/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-cyan hover:text-accent-cyan/80 font-mono transition-colors"
            >
              explorer ↗
            </a>
          </div>
        </div>
        {score && <ScoreBadge score={score.score} size="lg" />}
      </div>

      {/* AI Reasoning */}
      {score && (
        <div className="glow-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold font-mono text-accent-cyan">
              <span className="text-accent-magenta">//</span> AI Analysis
            </h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              score.confidence === 'high' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' :
              score.confidence === 'medium' ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20' :
              'bg-accent-red/10 text-accent-red border border-accent-red/20'
            }`}>
              {score.confidence}
            </span>
            <span className="text-xs text-muted font-mono ml-auto">
              src: {score.source === 'llm' ? 'neural' : 'heuristic'}
            </span>
          </div>
          <p className="text-sm text-foreground/70 mb-3 italic leading-relaxed">{score.reasoning}</p>

          <div className="flex flex-wrap gap-2">
            {score.risks.map((r, i) => (
              <span key={`r${i}`} className="text-xs bg-accent-red/5 text-accent-red px-2 py-1 rounded font-mono border border-accent-red/10">
                ▲ {r}
              </span>
            ))}
            {score.bullishFactors.map((f, i) => (
              <span key={`b${i}`} className="text-xs bg-accent-green/5 text-accent-green px-2 py-1 rounded font-mono border border-accent-green/10">
                ◆ {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wallet holdings */}
      <WalletHoldings tokenAddress={address} />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        <NeonStat label="Fill" value={`${curve.filledPercent.toFixed(1)}%`} sub={`${curve.totalBnb.toFixed(3)} BNB`} accent="text-accent-cyan" />
        <NeonStat label="Velocity" value={`${curve.velocity.toFixed(2)}`} sub={`BNB/hr · ${curve.velocityTrend}`} accent="text-accent-magenta" />
        <NeonStat label="Buyers" value={curve.uniqueBuyers} accent="text-accent-purple" />
        <NeonStat label="HHI" value={curve.hhi} sub={
          curve.hhi < 1500 ? 'low conc.' :
          curve.hhi < 2500 ? 'moderate' : 'HIGH RISK'
        } accent={curve.hhi >= 2500 ? 'text-accent-red' : 'text-accent-yellow'} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glow-card rounded-xl p-4">
          <h3 className="text-sm font-mono mb-3 text-accent-cyan/70">
            <span className="text-accent-magenta">//</span> Bonding Curve
          </h3>
          <CurveChart data={chartData} />
        </div>
        <div className="glow-card rounded-xl p-4">
          <h3 className="text-sm font-mono mb-3 text-accent-cyan/70">
            <span className="text-accent-magenta">//</span> Holder Distribution
          </h3>
          <HolderPie holders={curve.topHolders} hhi={curve.hhi} />
        </div>
      </div>

      {/* Alert Timeline */}
      {alerts.length > 0 && (
        <div className="glow-card rounded-xl p-4">
          <h3 className="text-sm font-mono mb-3 text-accent-cyan/70">
            <span className="text-accent-magenta">//</span> Alert Timeline
          </h3>
          <div className="space-y-1">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 text-sm py-2 border-b border-card-border/30 last:border-0">
                <span className="text-lg">{('alertType' in alert) ? '🐋' : '🎓'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-foreground/80">{alert.details || alert.timeToGraduate}</p>
                  <p className="text-xs text-muted font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {alert.severity && (
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    alert.severity === 'high' ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' :
                    alert.severity === 'medium' ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20' :
                    'bg-muted/10 text-muted border border-muted/20'
                  }`}>
                    {alert.severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NeonStat({ label, value, sub, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="glow-card rounded-xl px-4 py-3">
      <p className="text-xs text-muted font-mono uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold font-mono ${accent} neon-text-subtle`}>{value}</p>
      {sub && <p className="text-xs text-muted font-mono mt-0.5">{sub}</p>}
    </div>
  );
}
