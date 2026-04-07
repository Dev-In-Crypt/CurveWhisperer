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
            <stop offset="5%" stopColor="#00ccff" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#8844ff" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#8844ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: '#6a6a9a', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#1a1a3e' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#6a6a9a', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#1a1a3e' }}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10, 10, 24, 0.95)',
            border: '1px solid rgba(0, 204, 255, 0.3)',
            borderRadius: 8,
            fontFamily: 'monospace',
            boxShadow: '0 0 15px rgba(0, 204, 255, 0.1)',
          }}
          labelStyle={{ color: '#6a6a9a' }}
        />
        <ReferenceLine
          y={100}
          stroke="#00ff88"
          strokeDasharray="4 4"
          label={{ value: 'GRADUATION', fill: '#00ff88', fontSize: 10, fontFamily: 'monospace' }}
        />
        <Area
          type="monotone"
          dataKey="fill"
          stroke="#00ccff"
          fill="url(#fillGrad)"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 4px rgba(0, 204, 255, 0.4))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
