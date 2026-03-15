import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import {
  ACHIEVEMENT_DEFINITIONS,
  getUnlockedAchievements,
  calculateTotalXP,
} from "@/lib/gamification";

interface SetRow { weight: number; reps: number }
interface WorkoutExerciseRow { exercise_id?: string; sets?: SetRow[] }
interface WorkoutRow { workout_date: string; workout_exercises?: WorkoutExerciseRow[] }

/**
 * POST /api/achievements
 * Body: { achievementId: string }
 *
 * Verifies that:
 *  1. The achievement ID is valid
 *  2. The user has met the unlock conditions
 *  3. The achievement has not already been claimed
 *
 * On success, inserts into `user_achievements` and returns updated totalXP.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let achievementId: string;
  try {
    ({ achievementId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate the achievement ID
  const definition = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
  if (!definition) {
    return NextResponse.json({ error: "Unknown achievement" }, { status: 404 });
  }

  // Re-compute summary server-side to verify conditions are actually met
  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("workout_date, workout_exercises (exercise_id, sets (weight, reps))")
    .eq("user_id", user.id)
    .eq("status", "completed");

  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const totalWorkouts = (workouts as WorkoutRow[]).length;
  let totalSets = 0;
  let totalVolume = 0;
  const exerciseMaxWeights = new Map<string, number>();

  (workouts as WorkoutRow[]).forEach((w) => {
    (w.workout_exercises ?? []).forEach((we) => {
      if (!we.exercise_id) return;
      (we.sets ?? []).forEach((s) => {
        totalSets++;
        totalVolume += s.weight * s.reps;
        const cur = exerciseMaxWeights.get(we.exercise_id!) ?? 0;
        if (s.weight > cur) exerciseMaxWeights.set(we.exercise_id!, s.weight);
      });
    });
  });
  const prCount = exerciseMaxWeights.size;

  const uniqueDates = [
    ...new Set((workouts as WorkoutRow[]).map((w) => w.workout_date)),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let longestStreak = 0;
  if (uniqueDates.length > 0) {
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff =
        (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) /
        MS_PER_DAY;
      if (diff === 1) tempStreak++;
      else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const summary = { totalWorkouts, totalSets, prCount, longestStreak, totalVolume };

  // Check that the user has actually met the achievement conditions
  const unlocked = getUnlockedAchievements(summary);
  const achievementState = unlocked.find((a) => a.id === achievementId);
  if (!achievementState?.unlockedAt) {
    return NextResponse.json(
      { error: "Achievement conditions not yet met" },
      { status: 403 },
    );
  }

  // Insert claim (ON CONFLICT DO NOTHING keeps it idempotent)
  const { error: insertError } = await supabase
    .from("user_achievements")
    .upsert(
      { user_id: user.id, achievement_id: achievementId },
      { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
    );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Return new XP total
  const { data: claimedRows } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const claimedIds = (claimedRows ?? []).map(
    (r: { achievement_id: string }) => r.achievement_id,
  );

  const newXP = calculateTotalXP(summary, claimedIds);

  return NextResponse.json({ success: true, totalXP: newXP, xpEarned: definition.xpReward });
}
