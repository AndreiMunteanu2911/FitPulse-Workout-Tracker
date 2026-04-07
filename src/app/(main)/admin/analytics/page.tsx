'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Dumbbell, TrendingUp, BarChart3 } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import TimeRangeSelector from "@/components/admin/TimeRangeSelector";
import DailyWorkoutsChart from "@/components/admin/DailyWorkoutsChart";
import TopExercisesList from "@/components/admin/TopExercisesList";
import EmptyState from "@/components/admin/EmptyState";

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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function checkAdmin() {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) { router.push("/login"); return; }
      const session = await sessionRes.json();
      if (session.user?.role !== "admin") { router.push("/dashboard"); return; }
      setIsAdmin(true);
    }
    checkAdmin();
  }, [router]);

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

  if (!isAdmin || loading) {
    return (
      <div className="w-full">
        <div className="page-header mb-6">
          <Skeleton width={160} height={28} className="mb-2" />
          <Skeleton width={180} />
        </div>
        <Skeleton width={200} height={32} className="mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={80} className="rounded-lg" />
          ))}
        </div>
        <Skeleton height={220} className="rounded-lg mb-6" />
        <Skeleton height={200} className="rounded-lg" />
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
    <div className="w-full">
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
    </div>
  );
}
