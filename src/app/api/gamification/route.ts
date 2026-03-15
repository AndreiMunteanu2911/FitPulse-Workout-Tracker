import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import {
  ACHIEVEMENT_DEFINITIONS,
  calculateBaseXP,
  checkUnlockCondition,
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

interface AchievementRow {
  achievement_id: string;
  status: string;
  unlocked_at: string;
  claimed_at: string | null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── 1. Fetch all completed workouts ───────────────────────────────────────
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("workout_date, workout_exercises (exercise_id, sets (weight, reps))")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("workout_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalWorkouts = (workouts as WorkoutRow[]).length;

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

  const exerciseMaxWeights = new Map<string, number>();
  (workouts as WorkoutRow[]).forEach((w) => {
    (w.workout_exercises ?? []).forEach((we) => {
      if (!we.exercise_id) return;
      (we.sets ?? []).forEach((s) => {
        const current = exerciseMaxWeights.get(we.exercise_id!) ?? 0;
        if (s.weight > current) exerciseMaxWeights.set(we.exercise_id!, s.weight);
      });
    });
  });
  const prCount = exerciseMaxWeights.size;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const uniqueDates = [
    ...new Set((workouts as WorkoutRow[]).map((w) => w.workout_date)),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let longestStreak = 0;
  let currentStreak = 0;

  if (uniqueDates.length > 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - MS_PER_DAY).toISOString().split("T")[0];
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff =
          (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) /
          MS_PER_DAY;
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff =
        (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) /
        MS_PER_DAY;
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
  const baseXP = calculateBaseXP(summary);

  // ── 2. Sync: upsert newly-earned achievements into user_achievements ───────
  // For every achievement whose conditions are now met, make sure there is a row
  // in user_achievements (status='unlocked') so the DB stays current.
  const earnedIds = ACHIEVEMENT_DEFINITIONS
    .filter((def) => checkUnlockCondition(def.id, summary))
    .map((def) => def.id);

  if (earnedIds.length > 0) {
    // ignoreDuplicates=true is intentional: we never want to overwrite a
    // 'claimed' row back to 'unlocked' if a user somehow re-checks conditions.
    await supabase
      .from("user_achievements")
      .upsert(
        earnedIds.map((id) => ({ user_id: user.id, achievement_id: id, status: "unlocked" })),
        { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
      );
  }

  // ── 3. Read achievement rows from DB (source of truth) ────────────────────
  const { data: achievementRows } = await supabase
    .from("user_achievements")
    .select("achievement_id, status, unlocked_at, claimed_at")
    .eq("user_id", user.id);

  const dbMap = new Map<string, AchievementRow>(
    (achievementRows ?? []).map((r: AchievementRow) => [r.achievement_id, r]),
  );

  const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const row = dbMap.get(def.id);
    return {
      ...def,
      unlockedAt:  row ? row.unlocked_at : null,
      // claimed_at is set by the claim endpoint whenever status → 'claimed';
      // fall back to null to avoid showing a misleading timestamp
      claimedAt:   row?.status === "claimed" ? (row.claimed_at ?? null) : null,
    };
  });

  // ── 4. Read persistent achievement XP from user_stats ─────────────────────
  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("achievement_xp")
    .eq("user_id", user.id)
    .single();

  const achievementXP: number = (statsRow as { achievement_xp: number } | null)?.achievement_xp ?? 0;
  const totalXP = baseXP + achievementXP;
  const level = levelFromXP(totalXP);

  return NextResponse.json({
    gamification: {
      totalXP,
      level,
      xpForCurrentLevel: xpForLevel(level),
      xpForNextLevel: xpForLevel(level + 1),
      xpProgress: xpProgress(totalXP),
      achievements,
      currentStreak,
    },
  });
}
