'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#6b7280'];

interface Holder {
  address: string;
  percent: number;
}

export function HolderPie({ holders, hhi }: { holders: Holder[]; hhi: number }) {
  const totalPercent = holders.reduce((sum, h) => sum + h.percent, 0);
  const data = [
    ...holders.map(h => ({
      name: `${h.address.slice(0, 6)}...${h.address.slice(-4)}`,
      value: Math.round(h.percent * 10) / 10,
    })),
    ...(totalPercent < 100
      ? [{ name: 'Others', value: Math.round((100 - totalPercent) * 10) / 10 }]
      : []),
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${value}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-muted mt-1">HHI: {hhi}</p>
    </div>
  );
}
