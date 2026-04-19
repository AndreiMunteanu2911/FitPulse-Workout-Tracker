import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import {
  ACHIEVEMENT_DEFINITIONS,
  checkUnlockCondition,
  levelFromXP,
  xpForLevel,
  xpProgress,
} from "@/lib/gamification";

interface SetRow { weight: number; reps: number }
interface WorkoutExerciseRow { exercise_id?: string; sets?: SetRow[] }
interface WorkoutRow { workout_date: string; workout_exercises?: WorkoutExerciseRow[] }
interface UserStatsRow { total_xp: number; level: number }

/**
 * POST /api/achievements
 * Body: { achievementId: string }
 *
 * Claims an achievement:
 *  1. Validates the achievement ID and verifies conditions are met
 *  2. Inserts a row into user_achievements (unique constraint prevents double-claim)
 *  3. Reads current user_stats.total_xp then upserts with total_xp += xp_reward
 *  4. Returns the full updated XP stats so the page can update in-place
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let achievementId: string;
  try {
    ({ achievementId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const definition = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
  if (!definition) {
    return NextResponse.json({ error: "Unknown achievement" }, { status: 404 });
  }

  const { data: workouts, error: wErr } = await supabase
    .from("workouts")
    .select("workout_date, workout_exercises (exercise_id, sets (weight, reps))")
    .eq("user_id", user.id)
    .eq("status", "completed");

  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

  const rows = (workouts ?? []) as WorkoutRow[];
  let totalVolume = 0;
  const exerciseMaxWeights = new Map<string, number>();
  const MS_PER_DAY = 86_400_000;

  rows.forEach((w) => {
    (w.workout_exercises ?? []).forEach((we) => {
      (we.sets ?? []).forEach((s) => {
        totalVolume += s.weight * s.reps;
        if (we.exercise_id) {
          const prev = exerciseMaxWeights.get(we.exercise_id) ?? 0;
          if (s.weight > prev) exerciseMaxWeights.set(we.exercise_id, s.weight);
        }
      });
    });
  });

  const uniqueDates = [...new Set(rows.map((w) => w.workout_date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  let longestStreak = 0;
  if (uniqueDates.length > 0) {
    let temp = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) / MS_PER_DAY;
      if (diff === 1) {
        temp++;
      } else {
        longestStreak = Math.max(longestStreak, temp);
        temp = 1;
      }
    }
    longestStreak = Math.max(longestStreak, temp);
  }

  const summary = { totalWorkouts: rows.length, prCount: exerciseMaxWeights.size, longestStreak, totalVolume };

  if (!checkUnlockCondition(achievementId, summary)) {
    return NextResponse.json({ error: "Achievement conditions not yet met" }, { status: 403 });
  }

  const unlockedAt = new Date().toISOString();
  const { error: insertError } = await supabase
    .from("user_achievements")
    .insert({ user_id: user.id, achievement_id: achievementId, unlocked_at: unlockedAt });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Achievement already claimed" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("total_xp, level")
    .eq("user_id", user.id)
    .single();

  const currentXP = (statsRow as UserStatsRow | null)?.total_xp ?? 0;
  const newTotalXP = currentXP + definition.xpReward;
  const newLevel = levelFromXP(newTotalXP);

  const { error: upsertError } = await supabase
    .from("user_stats")
    .upsert(
      { user_id: user.id, total_xp: newTotalXP, level: newLevel },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    achievementId,
    claimedAt: unlockedAt,
    xpEarned: definition.xpReward,
    totalXP: newTotalXP,
    level: newLevel,
    xpForCurrentLevel: xpForLevel(newLevel),
    xpForNextLevel: xpForLevel(newLevel + 1),
    xpProgress: xpProgress(newTotalXP),
  });
}
