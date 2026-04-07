'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#00ccff', '#ff00cc', '#8844ff', '#00ff88', '#ffdd00', '#1a1a3e'];

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
            innerRadius={40}
            dataKey="value"
            label={({ value }) => `${value}%`}
            labelLine={false}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                style={{ filter: `drop-shadow(0 0 4px ${COLORS[i % COLORS.length]}40)` }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 10, 24, 0.95)',
              border: '1px solid rgba(0, 204, 255, 0.3)',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: '#6a6a9a', fontFamily: 'monospace' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-muted font-mono mt-1">
        HHI: <span className={hhi >= 2500 ? 'text-accent-red' : 'text-accent-yellow'}>{hhi}</span>
      </p>
    </div>
  );
}
