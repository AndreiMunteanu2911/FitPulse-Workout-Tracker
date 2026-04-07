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
    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5 mb-6">
      <h2 className="text-base font-bold text-[var(--foreground)] mb-4">Workouts per Day</h2>
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
    </div>
  );
}
