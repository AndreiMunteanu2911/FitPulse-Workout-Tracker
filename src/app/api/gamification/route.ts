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
interface WorkoutExerciseRow { sets?: SetRow[] }
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
    .select("workout_date, workout_exercises (sets (weight, reps))")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("workout_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalWorkouts = workouts.length;

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

  // Count unique PRs (exercises where we track max weight)
  const exerciseMaxWeights = new Map<string, number>();
  (workouts as (WorkoutRow & { workout_exercises?: (WorkoutExerciseRow & { exercise_id?: string })[] })[]).forEach((w) => {
    (w.workout_exercises ?? []).forEach((we) => {
      (we.sets ?? []).forEach((s) => {
        const key = (we as { exercise_id?: string }).exercise_id ?? "";
        const current = exerciseMaxWeights.get(key) ?? 0;
        if (s.weight > current) exerciseMaxWeights.set(key, s.weight);
      });
    });
  });
  const prCount = exerciseMaxWeights.size;

  // Calculate longest streak from unique dates
  const uniqueDates = [
    ...new Set(workouts.map((w: WorkoutRow) => w.workout_date)),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let longestStreak = 0;
  if (uniqueDates.length > 0) {
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
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
    },
  });
}
