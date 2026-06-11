'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Dumbbell, TrendingUp, BarChart3 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import TimeRangeSelector from "@/components/admin/TimeRangeSelector";
import DailyWorkoutsChart from "@/components/admin/DailyWorkoutsChart";
import TopExercisesList from "@/components/admin/TopExercisesList";
import EmptyState from "@/components/admin/EmptyState";
import { useAuthSession } from "@/components/AuthSessionProvider";

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalWorkouts: number;
  recentWorkouts: number;
  totalSets: number;
  recentVolume: number;
  topExercises: { exercise_id: string; count: number }[];
  dailyWorkouts: { date: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const { isAdmin, isAuthenticated } = useAuthSession();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.analytics);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  if (isAuthenticated && !isAdmin) return null;

  if (!isAdmin || loading) {
    return (
      <div className="flex min-h-[18rem] w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />}
        title="No data available"
        description="Try refreshing the page."
      />
    );
  }

  return (
    <LoadReveal className="page-stack">
      <AdminPageHeader
        title="Admin — Analytics"
        subtitle="Platform-wide usage metrics"
        backHref="/admin"
      />

      {/* Time Range Selector */}
      <TimeRangeSelector value={days} onChange={setDays} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <AdminStatCard
          title="Total Users"
          value={data.totalUsers}
          subtitle={`${data.activeUsers} in ${days}d`}
          icon={<Users className="w-4 h-4" />}
          accentColor="bg-[var(--primary-500)]"
        />
        <AdminStatCard
          title="Recent Workouts"
          value={data.recentWorkouts}
          subtitle={`${data.totalWorkouts} total`}
          icon={<Dumbbell className="w-4 h-4" />}
          accentColor="bg-[var(--primary-600)]"
        />
        <AdminStatCard
          title="Total Sets"
          value={data.totalSets}
          accentColor="bg-[var(--primary-700)]"
        />
        <AdminStatCard
          title="Volume"
          value={data.recentVolume >= 1000 ? `${(data.recentVolume / 1000).toFixed(1)}k` : data.recentVolume}
          subtitle={`kg in ${days}d`}
          icon={<TrendingUp className="w-4 h-4" />}
          accentColor="bg-[var(--primary-400)]"
        />
      </div>

      {/* Daily Workouts Chart */}
      <DailyWorkoutsChart data={data.dailyWorkouts} />

      {/* Top Exercises */}
      <TopExercisesList exercises={data.topExercises} />
    </LoadReveal>
  );
}
