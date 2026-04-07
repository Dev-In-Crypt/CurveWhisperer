'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DataPoint {
  time: string;
  fill: number;
}

export function CurveChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.25} />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.08} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: '#8b83a8', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#2d2250' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#8b83a8', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#2d2250' }}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(15, 11, 30, 0.95)',
            border: '1px solid rgba(45, 212, 191, 0.2)',
            borderRadius: 8,
            fontFamily: 'monospace',
            boxShadow: '0 0 15px rgba(45, 212, 191, 0.08)',
          }}
          labelStyle={{ color: '#8b83a8' }}
        />
        <ReferenceLine
          y={100}
          stroke="#34d399"
          strokeDasharray="4 4"
          label={{ value: 'GRADUATION', fill: '#34d399', fontSize: 10, fontFamily: 'monospace' }}
        />
        <Area
          type="monotone"
          dataKey="fill"
          stroke="#2dd4bf"
          fill="url(#fillGrad)"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 4px rgba(45, 212, 191, 0.3))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
