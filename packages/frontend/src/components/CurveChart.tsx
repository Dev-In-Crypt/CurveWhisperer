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
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: '#a1a1aa', fontSize: 11 }}
          axisLine={{ stroke: '#27272a' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#a1a1aa', fontSize: 11 }}
          axisLine={{ stroke: '#27272a' }}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
        />
        <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Graduation', fill: '#22c55e', fontSize: 11 }} />
        <Area type="monotone" dataKey="fill" stroke="#3b82f6" fill="url(#fillGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
