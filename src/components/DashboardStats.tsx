"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Skeleton from "react-loading-skeleton";
import StatCard from "@/components/StatCard";
import XPLevelCard from "@/components/XPLevelCard";
import AchievementsTeaserCard from "@/components/AchievementsTeaserCard";
import { WorkoutStats, GamificationStats } from "@/types";
import { BarChart2, Calendar, Flame, Sparkles, Zap, TrendingUp, Plus } from "lucide-react";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

export default function DashboardStats() {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, gamRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/gamification"),
        ]);
        if (!statsRes.ok) throw new Error("Failed to fetch stats");
        const statsData = await statsRes.json();
        setStats(statsData.stats);

        if (gamRes.ok) {
          const gamData = await gamRes.json();
          setGamification(gamData.gamification);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-lg)] p-6 text-center">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const maxCount = stats ? Math.max(...(stats.weeklyHistogram ?? []).map((w) => w.count), 1) : 0;

  // ── Gamification panel ────────────────
  const gamificationSection = gamification && (
    <div className="space-y-5">
      <XPLevelCard gamification={gamification} />
      <AchievementsTeaserCard achievements={gamification.achievements} />
    </div>
  );

  // ── Empty state (no workouts) ─────────
  if (stats && stats.totalWorkouts === 0) {
    return (
      <div className="space-y-5">
        <div className="text-center py-14 bg-[var(--surface)] rounded-md">
          <div className="w-20 h-20 mx-auto mb-5 rounded-[var(--radius-lg)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
            <Zap className="w-10 h-10 text-[var(--primary-600)] dark:text-[var(--primary-500)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2" style={{ fontFamily: "var(--font-poppins)" }}>Start your journey</h3>
          <p className="text-[var(--muted-foreground)] mb-6 max-w-xs mx-auto">Log your first workout to see your progress stats here.</p>
          <a
            href="/workout"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lime-green)] text-[#232323] rounded-full font-semibold shadow-[0_2px_10px_rgba(226,241,99,0.35)] hover:shadow-[0_4px_18px_rgba(226,241,99,0.45)] hover:brightness-105 transition"
          >
            <Plus className="w-4 h-4" />
            Start Workout
          </a>
        </div>
        {gamificationSection}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Primary stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Workouts"
          value={loading ? <Skeleton width={40} /> : stats?.totalWorkouts ?? 0}
          subtitle={loading ? <Skeleton width={80} /> : `${stats?.workoutsThisWeek ?? 0} this week`}
          trend="up"
          icon={<BarChart2 className="w-5 h-5" />}
        />
        <StatCard
          title="This Week"
          value={loading ? <Skeleton width={30} /> : stats?.workoutsThisWeek ?? 0}
          subtitle={loading ? <Skeleton width={80} /> : `${stats?.workoutsThisMonth ?? 0} this month`}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Streak"
          value={loading ? <Skeleton width={30} /> : `${stats?.currentStreak ?? 0}d`}
          subtitle={loading ? <Skeleton width={70} /> : `Longest: ${stats?.longestStreak ?? 0}d`}
          icon={<Flame className="w-5 h-5" />}
          trend={(stats?.currentStreak ?? 0) > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Personal Records"
          value={loading ? <Skeleton width={30} /> : stats?.prCount ?? 0}
          subtitle={loading ? <Skeleton width={80} /> : "Exercises tracked"}
          icon={<Sparkles className="w-5 h-5" />}
        />
      </div>

      {/* Volume stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          title="Total Volume"
          value={loading ? <Skeleton width={80} /> : formatNumber(stats?.totalVolume ?? 0) + " kg"}
          subtitle={loading ? <Skeleton width={60} /> : "All time"}
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          title="Weekly Volume"
          value={loading ? <Skeleton width={80} /> : formatNumber(stats?.weekVolume ?? 0) + " kg"}
          subtitle={loading ? <Skeleton width={70} /> : "This week"}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Weekly workout histogram */}
      {loading ? (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5">
          <Skeleton width={180} className="mb-4" />
          <div className="h-[160px] bg-[var(--surface-raised)] rounded-[var(--radius-sm)] animate-pulse" />
        </div>
      ) : stats?.weeklyHistogram && stats.weeklyHistogram.length > 0 && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5">
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: "var(--font-poppins)" }}>Workouts per Week <span className="font-normal text-[var(--muted-foreground)]">(last 12 weeks)</span></h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats?.weeklyHistogram ?? []} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
                cursor={{ fill: "var(--surface-raised)" }}
                contentStyle={{
                  background: "var(--primary-600)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                  fontWeight: 600,
                }}
                formatter={(value) => [value, "workouts"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {stats?.weeklyHistogram?.map((entry, index) => (
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

      {/* XP / Level + Achievements teaser */}
      {loading ? (
        <div className="space-y-5">
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5">
            <Skeleton height={60} className="mb-3" />
            <Skeleton height={40} />
          </div>
        </div>
      ) : gamificationSection}
    </div>
  );
}