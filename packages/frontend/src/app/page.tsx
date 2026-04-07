'use client';

import { useState, useEffect } from 'react';
import { useCurves } from '../hooks/useCurves';
import { CurveCard } from '../components/CurveCard';
import { fetchStats, fetchAlerts, StatsData, AlertData } from '../lib/api';

const SORT_OPTIONS = [
  { value: 'score', label: 'SCORE ↓' },
  { value: 'fill', label: 'FILL% ↓' },
  { value: 'velocity', label: 'VELOCITY ↓' },
  { value: 'newest', label: 'NEWEST' },
];

export default function Dashboard() {
  const [sortBy, setSortBy] = useState('score');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const { curves, loading } = useCurves(sortBy);

  useEffect(() => {
    fetchStats().then(setStats);
    fetchAlerts({ limit: 20 }).then(d => d && setAlerts(d.alerts));
    const interval = setInterval(() => {
      fetchStats().then(setStats);
      fetchAlerts({ limit: 20 }).then(d => d && setAlerts(d.alerts));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = search
    ? curves.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase())
      )
    : curves;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 relative z-10">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8 stagger">
        <StatCard
          label="Active Curves"
          value={stats ? stats.activeCurves : '...'}
          icon="◈"
          accent="text-accent-cyan"
        />
        <StatCard
          label="Graduations Today"
          value={stats ? stats.graduationsToday : '...'}
          icon="◆"
          accent="text-accent-green"
        />
        <StatCard
          label="Top Score"
          value={stats?.topScore ? `${stats.topScore.score}/100` : '—'}
          sub={stats?.topScore?.name}
          icon="◉"
          accent="text-accent-magenta"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-cyan/40 font-mono text-sm">{'>'}</span>
          <input
            type="text"
            placeholder="search token, symbol, or 0x..."
            className="w-full glow-card rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent-cyan/50 placeholder:text-muted/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="glow-card rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent-cyan/50 appearance-none cursor-pointer text-accent-cyan"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Curve grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glow-card rounded-xl p-4 animate-pulse h-40 border-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 font-mono">
          <div className="text-4xl text-accent-cyan/20 mb-4">⟨ ⟩</div>
          <p className="text-muted">
            {search ? 'No curves match query.' : 'No active bonding curves detected.'}
          </p>
          <p className="text-accent-cyan/30 text-xs mt-2">Monitoring Four.Meme in real-time...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
          {filtered.map(curve => (
            <CurveCard key={curve.address} curve={curve} />
          ))}
        </div>
      )}

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-mono mb-4 text-accent-purple/70 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-magenta animate-pulse shadow-[0_0_6px_rgba(167,139,250,0.4)]" />
            Recent Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {alerts.slice(0, 6).map(alert => (
              <div key={alert.id} className="glow-card rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{'alertType' in alert ? '🐋' : '🎓'}</span>
                  <span className="font-mono font-medium truncate">
                    {alert.tokenName || alert.name || alert.tokenAddress?.slice(0, 12)}
                  </span>
                  {alert.severity && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ml-auto ${
                      alert.severity === 'high' ? 'bg-accent-red/10 text-accent-red' :
                      alert.severity === 'medium' ? 'bg-accent-yellow/10 text-accent-yellow' :
                      'bg-muted/10 text-muted'
                    }`}>
                      {alert.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-mono truncate">
                  {alert.details || (alert.timeToGraduate ? `Graduated in ${alert.timeToGraduate}` : '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="glow-card rounded-xl px-5 py-4 border-pulse">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted font-mono uppercase tracking-wider">{label}</p>
        <span className={`${accent} opacity-40`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${accent} neon-text-subtle`}>{value}</p>
      {sub && <p className="text-xs text-muted truncate font-mono mt-0.5">{sub}</p>}
    </div>
  );
}
