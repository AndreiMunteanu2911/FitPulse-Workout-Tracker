import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface DailyWorkoutsChartProps {
  data: { date: string; count: number }[];
}

export default function DailyWorkoutsChart({ data }: DailyWorkoutsChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <section className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] sm:p-6">
      <p className="eyebrow">Training activity</p>
      <h2 className="mb-5 text-lg font-extrabold text-[var(--foreground)]">Workouts per day</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
