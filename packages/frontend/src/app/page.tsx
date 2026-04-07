'use client';

import { useState, useEffect } from 'react';
import { useCurves } from '../hooks/useCurves';
import { CurveCard } from '../components/CurveCard';
import { LiveFeed } from '../components/LiveFeed';
import { fetchStats, StatsData } from '../lib/api';

const SORT_OPTIONS = [
  { value: 'score', label: 'Score ↓' },
  { value: 'fill', label: 'Fill % ↓' },
  { value: 'velocity', label: 'Velocity ↓' },
  { value: 'newest', label: 'Newest' },
];

export default function Dashboard() {
  const [sortBy, setSortBy] = useState('score');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const { curves, loading, connected } = useCurves(sortBy);

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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Curves" value={stats?.activeCurves ?? '—'} />
        <StatCard label="Graduations Today" value={stats?.graduationsToday ?? '—'} />
        <StatCard
          label="Top Score"
          value={stats?.topScore ? `${stats.topScore.score}/100` : '—'}
          sub={stats?.topScore?.name}
        />
        <StatCard label="Connection" value={connected ? 'Live' : 'Offline'} color={connected ? 'text-accent-green' : 'text-accent-red'} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by name, symbol, or address..."
              className="flex-1 bg-card border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-blue"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="bg-card border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-card-border rounded-xl p-4 animate-pulse h-40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {search ? 'No curves match your search.' : 'No active bonding curves detected.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(curve => (
                <CurveCard key={curve.address} curve={curve} />
              ))}
            </div>
          )}
        </div>

        {/* Live feed sidebar */}
        <div className="lg:w-80 shrink-0">
          <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">Live Feed</h2>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl px-4 py-3">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted truncate">{sub}</p>}
    </div>
  );
}
