import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import {
  calculateTotalXP,
  getUnlockedAchievements,
  levelFromXP,
  xpForLevel,
  xpProgress,
} from "@/lib/gamification";

interface SetRow { weight: number; reps: number }

interface WorkoutExerciseRow {
  exercise_id?: string;
  sets?: SetRow[];
}

interface WorkoutRow {
  workout_date: string;
  workout_exercises?: WorkoutExerciseRow[];
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all completed workouts with exercises and sets
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("workout_date, workout_exercises (exercise_id, sets (weight, reps))")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("workout_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalWorkouts = (workouts as WorkoutRow[]).length;

  // Count total sets and volume
  let totalSets = 0;
  let totalVolume = 0;
  (workouts as WorkoutRow[]).forEach((w) => {
    (w.workout_exercises ?? []).forEach((we) => {
      (we.sets ?? []).forEach((s) => {
        totalSets++;
        totalVolume += s.weight * s.reps;
      });
    });
  });

  // Count unique exercises that have a tracked max weight (used as PR proxy)
  const exerciseMaxWeights = new Map<string, number>();
  (workouts as WorkoutRow[]).forEach((w) => {
    (w.workout_exercises ?? []).forEach((we) => {
      // Skip exercises without a valid ID so they don't inflate the PR count
      if (!we.exercise_id) return;
      (we.sets ?? []).forEach((s) => {
        const current = exerciseMaxWeights.get(we.exercise_id!) ?? 0;
        if (s.weight > current) exerciseMaxWeights.set(we.exercise_id!, s.weight);
      });
    });
  });
  const prCount = exerciseMaxWeights.size;

  // Calculate streaks from unique workout dates (newest first)
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const uniqueDates = [
    ...new Set((workouts as WorkoutRow[]).map((w) => w.workout_date)),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let longestStreak = 0;
  let currentStreak = 0;

  if (uniqueDates.length > 0) {
    // Current streak: must include today or yesterday to be active
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - MS_PER_DAY).toISOString().split("T")[0];
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diff = (prev.getTime() - curr.getTime()) / MS_PER_DAY;
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    // Longest streak
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / MS_PER_DAY;
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const summary = { totalWorkouts, totalSets, prCount, longestStreak, totalVolume };
  const totalXP = calculateTotalXP(summary);
  const level = levelFromXP(totalXP);

  return NextResponse.json({
    gamification: {
      totalXP,
      level,
      xpForCurrentLevel: xpForLevel(level),
      xpForNextLevel: xpForLevel(level + 1),
      xpProgress: xpProgress(totalXP),
      achievements: getUnlockedAchievements(summary),
      currentStreak,
    },
  });
}
