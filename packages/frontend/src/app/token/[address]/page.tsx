'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchCurveDetail, CurveData, AlertData } from '../../../lib/api';
import { BSC_EXPLORER } from '../../../lib/constants';
import { ScoreBadge } from '../../../components/ScoreBadge';
import { CurveChart } from '../../../components/CurveChart';
import { HolderPie } from '../../../components/HolderPie';

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
          <div className="h-8 bg-card rounded w-1/3" />
          <div className="h-64 bg-card rounded" />
          <div className="h-48 bg-card rounded" />
        </div>
      </div>
    );
  }

  if (!curve) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-muted mb-4">Token not found in active curves.</p>
        <Link href="/" className="text-accent-blue hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const score = curve.lastScore;
  const chartData = [{ time: 'now', fill: curve.filledPercent }];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link href="/" className="text-sm text-muted hover:text-foreground">← Back to Dashboard</Link>

      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{curve.name} <span className="text-muted font-normal">({curve.symbol})</span></h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-muted bg-card px-2 py-1 rounded">{address}</code>
            <button onClick={copyAddress} className="text-xs text-accent-blue hover:underline">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={`${BSC_EXPLORER}/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-blue hover:underline"
            >
              BscScan ↗
            </a>
          </div>
        </div>
        {score && <ScoreBadge score={score.score} size="lg" />}
      </div>

      {/* AI Reasoning */}
      {score && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold">AI Analysis</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              score.confidence === 'high' ? 'bg-accent-green/20 text-accent-green' :
              score.confidence === 'medium' ? 'bg-accent-yellow/20 text-accent-yellow' :
              'bg-accent-red/20 text-accent-red'
            }`}>
              {score.confidence} confidence
            </span>
            <span className="text-xs text-muted ml-auto">
              {score.source === 'llm' ? 'AI' : 'Rule-based fallback'}
            </span>
          </div>
          <p className="text-sm text-muted mb-3 italic">{score.reasoning}</p>

          <div className="flex flex-wrap gap-2">
            {score.risks.map((r, i) => (
              <span key={`r${i}`} className="text-xs bg-accent-red/10 text-accent-red px-2 py-1 rounded">
                ⚠️ {r}
              </span>
            ))}
            {score.bullishFactors.map((f, i) => (
              <span key={`b${i}`} className="text-xs bg-accent-green/10 text-accent-green px-2 py-1 rounded">
                ✅ {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Fill" value={`${curve.filledPercent.toFixed(1)}%`} sub={`${curve.totalBnb.toFixed(3)} BNB`} />
        <MiniStat label="Velocity" value={`${curve.velocity.toFixed(2)} BNB/hr`} sub={curve.velocityTrend} />
        <MiniStat label="Buyers" value={curve.uniqueBuyers} />
        <MiniStat label="HHI" value={curve.hhi} sub={
          curve.hhi < 1500 ? 'Low concentration' :
          curve.hhi < 2500 ? 'Moderate' : 'High concentration'
        } />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Bonding Curve Progress</h3>
          <CurveChart data={chartData} />
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Holder Distribution</h3>
          <HolderPie holders={curve.topHolders} hhi={curve.hhi} />
        </div>
      </div>

      {/* Alert Timeline */}
      {alerts.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Alert Timeline</h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 text-sm py-2 border-b border-card-border last:border-0">
                <span>{'alertType' in alert ? '🐋' : '🎓'}</span>
                <div className="flex-1 min-w-0">
                  <p>{alert.details || alert.timeToGraduate}</p>
                  <p className="text-xs text-muted">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {alert.severity && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    alert.severity === 'high' ? 'bg-accent-red/20 text-accent-red' :
                    alert.severity === 'medium' ? 'bg-accent-yellow/20 text-accent-yellow' :
                    'bg-muted/20 text-muted'
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

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
