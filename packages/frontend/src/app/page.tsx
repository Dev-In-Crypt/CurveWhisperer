'use client';

import { useState, useEffect } from 'react';
import { useCurves } from '../hooks/useCurves';
import { CurveCard } from '../components/CurveCard';
import { LiveFeed } from '../components/LiveFeed';
import { fetchStats, StatsData } from '../lib/api';

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
  const { curves, loading } = useCurves(sortBy);

  useEffect(() => {
    fetchStats().then(setStats);
    const interval = setInterval(() => fetchStats().then(setStats), 30000);
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
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
        </div>

        {/* Live feed sidebar */}
        <div className="lg:w-72 shrink-0">
          <h2 className="text-xs font-mono mb-3 text-accent-purple/70 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-magenta animate-pulse shadow-[0_0_6px_rgba(167,139,250,0.4)]" />
            Live Signal Feed
          </h2>
          <LiveFeed />
        </div>
      </div>
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
