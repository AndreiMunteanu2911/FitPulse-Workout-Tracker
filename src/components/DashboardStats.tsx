"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Dumbbell,
  Flame,
  History,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import XPLevelCard from "@/components/XPLevelCard";
import AchievementsTeaserCard from "@/components/AchievementsTeaserCard";
import Button from "@/components/Button";
import type { GamificationStats, Workout, WorkoutStats } from "@/types";

const WEEKLY_WORKOUT_GOAL = 4;

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}

function formatWorkoutDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function getWorkoutDuration(workout: Workout): string | null {
  if (!workout.created_at || !workout.finished_at) return null;
  const minutes = Math.round(
    (new Date(workout.finished_at).getTime() - new Date(workout.created_at).getTime()) / 60_000,
  );
  if (minutes < 1) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getWorkoutVolume(workout: Workout): number {
  return workout.workout_exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.reduce((setTotal, set) => setTotal + set.reps * set.weight, 0),
    0,
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [draftWorkout, setDraftWorkout] = useState<Workout | null>(null);
  const [recentWorkout, setRecentWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, gamificationRes, draftRes, workoutsRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/gamification"),
          fetch("/api/workouts/draft"),
          fetch("/api/workouts"),
        ]);

        if (!statsRes.ok) throw new Error("Failed to fetch dashboard");

        const statsData = await statsRes.json();
        setStats(statsData.stats);

        if (gamificationRes.ok) {
          const gamificationData = await gamificationRes.json();
          setGamification(gamificationData.gamification);
        }

        if (draftRes.ok) {
          const draftData = await draftRes.json();
          setDraftWorkout(draftData.workout ?? null);
        }

        if (workoutsRes.ok) {
          const workoutsData = await workoutsRes.json();
          setRecentWorkout(workoutsData.workouts?.[0] ?? null);
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-destructive-bg)] p-6 text-center text-[var(--color-destructive)]">
        <p className="font-semibold">{error ?? "Dashboard data is unavailable."}</p>
      </div>
    );
  }

  const weeklyProgress = Math.min(100, Math.round((stats.workoutsThisWeek / WEEKLY_WORKOUT_GOAL) * 100));
  const maxCount = Math.max(...stats.weeklyHistogram.map((week) => week.count), 1);
  const recentDuration = recentWorkout ? getWorkoutDuration(recentWorkout) : null;
  const recentVolume = recentWorkout ? getWorkoutVolume(recentWorkout) : 0;
  const draftExerciseCount = draftWorkout?.workout_exercises.length ?? 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--primary-500)] p-6 text-white shadow-[var(--shadow-md)] sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-[var(--lime-green)]/15 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65">
              {draftWorkout ? "Workout in progress" : "Ready to train"}
            </p>
            <h2 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
              {draftWorkout ? draftWorkout.name : "Make today count."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              {draftWorkout
                ? `Continue where you left off with ${draftExerciseCount} ${draftExerciseCount === 1 ? "exercise" : "exercises"} already added.`
                : "Start a focused session, track every set, and keep this week's progress moving."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="lime">
                <Link href="/workout">
                  <Dumbbell className="size-4" />
                  {draftWorkout ? "Continue workout" : "Start workout"}
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-white/15 bg-white/10 text-white shadow-none hover:bg-white/15">
                <Link href="/history">
                  <History className="size-4" />
                  View history
                </Link>
              </Button>
            </div>
          </div>

          <div className="min-w-52 rounded-[var(--radius-xl)] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-white/75">Weekly goal</span>
              <span className="text-sm font-bold">{stats.workoutsThisWeek}/{WEEKLY_WORKOUT_GOAL}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[var(--lime-green)] transition-all duration-700"
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/60">
              {stats.workoutsThisWeek >= WEEKLY_WORKOUT_GOAL
                ? "Weekly target complete."
                : `${WEEKLY_WORKOUT_GOAL - stats.workoutsThisWeek} more ${WEEKLY_WORKOUT_GOAL - stats.workoutsThisWeek === 1 ? "workout" : "workouts"} to reach your target.`}
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">This week</p>
            <h2 className="section-heading">Training summary</h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="icon-tile"><Target className="size-5" /></div>
              <span className="text-xs font-bold text-[var(--primary-600)]">{weeklyProgress}%</span>
            </div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-[var(--foreground)]">
              {stats.workoutsThisWeek}<span className="text-lg text-[var(--muted-foreground)]">/{WEEKLY_WORKOUT_GOAL}</span>
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">Weekly workouts</p>
          </div>

          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="icon-tile"><Flame className="size-5" /></div>
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Best {stats.longestStreak}d</span>
            </div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-[var(--foreground)]">{stats.currentStreak}d</p>
            <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">Current streak</p>
          </div>

          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="icon-tile"><TrendingUp className="size-5" /></div>
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">{stats.prCount} PRs</span>
            </div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-[var(--foreground)]">{formatNumber(stats.weekVolume)} kg</p>
            <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">Volume this week</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Latest session</p>
            <h2 className="section-heading">Recent workout</h2>
          </div>
          {recentWorkout && (
            <Link href="/history" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-600)]">
              All history <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {recentWorkout ? (
          <motion.div key={recentWorkout.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <Link href={`/history/${recentWorkout.id}`} className="card-interactive group block p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="icon-tile !size-12"><CalendarDays className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary-600)]">
                    {recentWorkout.name}
                  </h3>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                    {formatWorkoutDate(recentWorkout.workout_date)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-sm text-[var(--muted-foreground)]">
                  {recentWorkout.workout_exercises.map((exercise) => exercise.exercise.name).join(" / ") || "No exercises recorded"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-soft">{recentWorkout.workout_exercises.length} exercises</span>
                <span className="badge badge-soft">{formatNumber(recentVolume)} kg</span>
                {recentDuration && (
                  <span className="badge badge-soft"><Clock3 className="size-3.5" />{recentDuration}</span>
                )}
              </div>
              <ArrowRight className="hidden size-5 text-[var(--muted-foreground)] sm:block" />
            </div>
          </Link>
          </motion.div>
        ) : (
          <motion.div key="empty" className="empty-state !min-h-48" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
            <div className="empty-state-icon"><Dumbbell className="size-6" /></div>
            <h3 className="empty-state-title">No completed workout yet</h3>
            <p className="empty-state-description">Your latest session will appear here after you finish it.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </section>

      <AnimatePresence initial={false}>
      {gamification && (
        <motion.section className="section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Progress</p>
              <h2 className="section-heading">Level and achievements</h2>
            </div>
            <Trophy className="size-5 text-[var(--primary-500)]" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <XPLevelCard gamification={gamification} />
            <AchievementsTeaserCard achievements={gamification.achievements} />
          </div>
        </motion.section>
      )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
      {stats.weeklyHistogram.length > 0 && (
        <motion.section className="section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Long-term activity</p>
              <h2 className="section-heading">Last 12 weeks</h2>
            </div>
            <Sparkles className="size-5 text-[var(--primary-500)]" />
          </div>
          <div className="card p-5 sm:p-6">
            <ResponsiveContainer width="100%" height={190}>
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
                  {stats.weeklyHistogram.map((entry, index) => (
                    <Cell
                      key={`${entry.weekLabel}-${index}`}
                      fill={entry.count > 0 ? "var(--primary-500)" : "var(--surface-raised)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      )}
      </AnimatePresence>
    </div>
  );
}
