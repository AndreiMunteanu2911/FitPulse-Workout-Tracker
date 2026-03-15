import type { Achievement, ExerciseType } from "@/types";

// ── XP / Level maths ─────────────────────────────────────────────────────────
// Level formula: level = floor(sqrt(totalXP / 50)) + 1
// Level 1 starts at   0 XP
// Level 2 starts at 200 XP  (sqrt(200/50)=2  → floor=2, +1=2 … wait, let me fix)
// We want:  level = 1 + floor(sqrt(totalXP / 50))
//   L1: 0–49     (sqrt < 1)
//   L2: 50–199   (sqrt ≥ 1 and < 2, but * 50 → 50)
// Actually: thresholds[n] = (n)^2 * 50
//   L1: 0 XP     threshold to reach L2 = 50
//   L2: 50 XP    threshold to reach L3 = 200
//   L3: 200 XP   threshold to reach L4 = 450
//   L5: 800 XP   threshold to reach L6 = 1250
export function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

/** XP required to reach `level` (cumulative, starting from 0). */
export function xpForLevel(level: number): number {
  const n = level - 1;
  return n * n * 50;
}

/** 0–100 progress percentage through the current level. */
export function xpProgress(xp: number): number {
  const level = levelFromXP(xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return Math.min(100, Math.round(((xp - start) / (end - start)) * 100));
}

// ── XP rewards ───────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  PER_WORKOUT: 100,
  PER_SET: 5,
  PER_PR: 50,
  PER_STREAK_DAY: 10,
} as const;

// ── Achievement definitions ───────────────────────────────────────────────────
// `icon` is a Lucide component name — rendered in the UI via a lookup map.
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlockedAt" | "claimedAt">[] = [
  // Workout count
  {
    id: "first_workout",
    name: "First Step",
    description: "Complete your first workout",
    icon: "Dumbbell",
    xpReward: 50,
    category: "workouts",
  },
  {
    id: "workouts_5",
    name: "Warm Up",
    description: "Complete 5 workouts",
    icon: "Activity",
    xpReward: 100,
    category: "workouts",
  },
  {
    id: "workouts_10",
    name: "Getting Serious",
    description: "Complete 10 workouts",
    icon: "TrendingUp",
    xpReward: 200,
    category: "workouts",
  },
  {
    id: "workouts_25",
    name: "Dedicated",
    description: "Complete 25 workouts",
    icon: "Star",
    xpReward: 300,
    category: "workouts",
  },
  {
    id: "workouts_100",
    name: "Century Club",
    description: "Complete 100 workouts",
    icon: "Award",
    xpReward: 1000,
    category: "workouts",
  },
  // Streaks
  {
    id: "streak_3",
    name: "Hat Trick",
    description: "Maintain a 3-day workout streak",
    icon: "Zap",
    xpReward: 75,
    category: "streaks",
  },
  {
    id: "streak_7",
    name: "On Fire",
    description: "Maintain a 7-day workout streak",
    icon: "Flame",
    xpReward: 150,
    category: "streaks",
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "Maintain a 30-day workout streak",
    icon: "Rocket",
    xpReward: 500,
    category: "streaks",
  },
  // PRs
  {
    id: "pr_1",
    name: "Record Setter",
    description: "Set your first personal record",
    icon: "Trophy",
    xpReward: 75,
    category: "records",
  },
  {
    id: "pr_5",
    name: "PR Crusher",
    description: "Set 5 personal records",
    icon: "Target",
    xpReward: 150,
    category: "records",
  },
  {
    id: "pr_10",
    name: "Record Breaker",
    description: "Set 10 personal records",
    icon: "Medal",
    xpReward: 300,
    category: "records",
  },
  // Volume
  {
    id: "volume_10k",
    name: "Iron Starter",
    description: "Lift 10,000 kg total volume",
    icon: "BarChart2",
    xpReward: 100,
    category: "volume",
  },
  {
    id: "volume_50k",
    name: "Heavy Lifter",
    description: "Lift 50,000 kg total volume",
    icon: "ChartBarIncreasing",
    xpReward: 250,
    category: "volume",
  },
  {
    id: "volume_100k",
    name: "Volume King",
    description: "Lift 100,000 kg total volume",
    icon: "Crown",
    xpReward: 500,
    category: "volume",
  },
];

// ── Achievement unlock check ──────────────────────────────────────────────────
export interface WorkoutSummary {
  totalWorkouts: number;
  totalSets: number;
  prCount: number;
  longestStreak: number;
  totalVolume: number;
}

export function getUnlockedAchievements(
  summary: WorkoutSummary,
  claimedIds: string[] = [],
): Achievement[] {
  const { totalWorkouts, prCount, longestStreak, totalVolume } = summary;

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    let unlocked = false;

    switch (def.id) {
      case "first_workout":   unlocked = totalWorkouts >= 1; break;
      case "workouts_5":      unlocked = totalWorkouts >= 5; break;
      case "workouts_10":     unlocked = totalWorkouts >= 10; break;
      case "workouts_25":     unlocked = totalWorkouts >= 25; break;
      case "workouts_100":    unlocked = totalWorkouts >= 100; break;
      case "streak_3":        unlocked = longestStreak >= 3; break;
      case "streak_7":        unlocked = longestStreak >= 7; break;
      case "streak_30":       unlocked = longestStreak >= 30; break;
      case "pr_1":            unlocked = prCount >= 1; break;
      case "pr_5":            unlocked = prCount >= 5; break;
      case "pr_10":           unlocked = prCount >= 10; break;
      case "volume_10k":      unlocked = totalVolume >= 10000; break;
      case "volume_50k":      unlocked = totalVolume >= 50000; break;
      case "volume_100k":     unlocked = totalVolume >= 100000; break;
    }

    const claimedAt = claimedIds.includes(def.id) ? "claimed" : null;

    return {
      ...def,
      unlockedAt: unlocked ? "unlocked" : null,
      claimedAt,
    };
  });
}

// ── XP total calculation ──────────────────────────────────────────────────────
/**
 * Base XP comes from activity (workouts, sets, PRs, streak days).
 * Achievement XP bonuses are only added for *claimed* achievements so the
 * user must consciously collect rewards.
 */
export function calculateTotalXP(
  summary: WorkoutSummary,
  claimedAchievementIds: string[] = [],
): number {
  const { totalWorkouts, totalSets, prCount, longestStreak } = summary;

  const baseXP =
    totalWorkouts * XP_REWARDS.PER_WORKOUT +
    totalSets * XP_REWARDS.PER_SET +
    prCount * XP_REWARDS.PER_PR +
    longestStreak * XP_REWARDS.PER_STREAK_DAY;

  // Only add XP for achievements the user has explicitly claimed
  const achievementXP = ACHIEVEMENT_DEFINITIONS
    .filter((a) => claimedAchievementIds.includes(a.id))
    .reduce((sum, a) => sum + a.xpReward, 0);

  return baseXP + achievementXP;
}

// ── Rest timer helpers ────────────────────────────────────────────────────────
const COMPOUND_MUSCLES = new Set([
  "back", "chest", "upper legs", "lower legs", "waist",
  "quads", "hamstrings", "glutes", "spine",
]);

const COMPOUND_BODY_PARTS = new Set([
  "back", "chest", "upper legs", "lower legs",
]);

export function detectExerciseType(exercise: {
  target_muscles?: string[] | null;
  body_parts?: string[] | null;
}): ExerciseType {
  const muscles = (exercise.target_muscles ?? []).map((m) => m.toLowerCase());
  const parts = (exercise.body_parts ?? []).map((p) => p.toLowerCase());

  const isCompound =
    muscles.some((m) => COMPOUND_MUSCLES.has(m)) ||
    parts.some((p) => COMPOUND_BODY_PARTS.has(p));

  return isCompound ? "compound" : "isolation";
}

export const REST_DURATIONS: Record<ExerciseType, number> = {
  compound: 180,   // 3 minutes
  isolation: 90,   // 90 seconds
};
