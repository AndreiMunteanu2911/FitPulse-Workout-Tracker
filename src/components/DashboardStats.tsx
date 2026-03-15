"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BarChart2, Calendar, Flame, Sparkles, Zap, TrendingUp, Plus } from "lucide-react";
import { WorkoutStats } from "@/types";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

export default function DashboardStats() {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <LoadingSpinner size={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-xl)] p-6 text-center">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!stats || stats.totalWorkouts === 0) {
    return (
      <div className="text-center py-16 bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow)]">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
          <Zap className="w-10 h-10 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
        </div>
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Start your journey</h3>
        <p className="text-[var(--muted-foreground)] mb-6 max-w-xs mx-auto">Log your first workout to see your progress stats here.</p>
        <a
          href="/workout"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-700)] text-white rounded-xl font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)] hover:brightness-105 transition"
        >
          <Plus className="w-4 h-4" />
          Start Workout
        </a>
      </div>
    );
  }

  const maxCount = Math.max(...(stats.weeklyHistogram ?? []).map((w) => w.count), 1);

  return (
    <div className="space-y-4">
      {/* Primary stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Workouts"
          value={stats.totalWorkouts}
          subtitle={`${stats.workoutsThisWeek} this week`}
          trend="up"
          icon={<BarChart2 className="w-5 h-5" />}
        />
        <StatCard
          title="This Week"
          value={stats.workoutsThisWeek}
          subtitle={`${stats.workoutsThisMonth} this month`}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Streak"
          value={`${stats.currentStreak}d`}
          subtitle={`Longest: ${stats.longestStreak}d`}
          icon={<Flame className="w-5 h-5" />}
          trend={stats.currentStreak > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Personal Records"
          value={stats.prCount}
          subtitle="Exercises tracked"
          icon={<Sparkles className="w-5 h-5" />}
        />
      </div>

      {/* Volume stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          title="Total Volume"
          value={formatNumber(stats.totalVolume) + " kg"}
          subtitle="All time"
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          title="Weekly Volume"
          value={formatNumber(stats.weekVolume) + " kg"}
          subtitle="This week"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Weekly workout histogram */}
      {stats.weeklyHistogram && stats.weeklyHistogram.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Workouts per Week <span className="font-normal text-[var(--muted-foreground)]">(last 12 weeks)</span></h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.weeklyHistogram} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval={1}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                domain={[0, maxCount + 1]}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-raised)", radius: 4 }}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(value: number) => [value, "workouts"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {stats.weeklyHistogram.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count > 0 ? "var(--primary-500)" : "var(--surface-raised)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
