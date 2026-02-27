"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { WorkoutStats } from "@/types";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats || stats.totalWorkouts === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)] text-lg mb-4">No workouts yet. Start your fitness journey!</p>
        <a
          href="/workout"
          className="inline-block px-6 py-3 bg-[var(--primary-600)] dark:bg-[var(--primary-500)] text-white rounded-md hover:bg-[var(--primary-700)] dark:hover:bg-[var(--primary-400)] transition"
        >
          Start Workout
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* First row - Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workouts"
          value={stats.totalWorkouts}
          subtitle={stats.workoutsThisWeek + " this week"}
          trend="up"
        />
        <StatCard
          title="This Week"
          value={stats.workoutsThisWeek}
          subtitle={stats.workoutsThisMonth + " this month"}
        />
        <StatCard
          title="Current Streak"
          value={stats.currentStreak + " days"}
          subtitle={"Longest: " + stats.longestStreak + " days"}
        />
        <StatCard
          title="Personal Records"
          value={stats.prCount}
          subtitle="Exercises tracked"
        />
      </div>

      {/* Second row - Volume stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Volume"
          value={formatNumber(stats.totalVolume)}
          subtitle="kg lifted (all time)"
          trend="up"
        />
        <StatCard
          title="Weekly Volume"
          value={formatNumber(stats.weekVolume)}
          subtitle="kg lifted (this week)"
        />
      </div>
    </div>
  );
}
