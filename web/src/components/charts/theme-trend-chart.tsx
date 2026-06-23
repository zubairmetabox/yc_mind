"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LINE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#a78bfa",
];

export function ThemeTrendChart({
  batches,
  series,
}: {
  batches: string[];
  series: { name: string; values: number[] }[];
}) {
  const data = batches.map((batch, i) => {
    const row: Record<string, string | number> = { batch };
    for (const s of series) row[s.name] = Math.round(s.values[i] * 1000) / 10; // percent, 1 decimal
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="batch"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          interval={Math.max(0, Math.floor(batches.length / 10))}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={36}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          formatter={(value) => `${value}%`}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
