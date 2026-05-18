import { describe, expect, it } from "vitest";
import {
  REST_DURATIONS,
  checkUnlockCondition,
  detectExerciseType,
  levelFromXP,
  xpForLevel,
  xpProgress,
} from "./gamification";

describe("XP helpers", () => {
  it("maps cumulative XP to levels and current level progress", () => {
    expect(levelFromXP(0)).toBe(1);
    expect(levelFromXP(50)).toBe(2);
    expect(xpForLevel(4)).toBe(450);
    expect(xpProgress(125)).toBe(50);
  });
});

describe("achievement conditions", () => {
  it("checks workout, streak, PR, and volume thresholds", () => {
    const summary = { totalWorkouts: 10, prCount: 5, longestStreak: 7, totalVolume: 50_000 };

    expect(checkUnlockCondition("workouts_10", summary)).toBe(true);
    expect(checkUnlockCondition("streak_30", summary)).toBe(false);
    expect(checkUnlockCondition("pr_5", summary)).toBe(true);
    expect(checkUnlockCondition("volume_100k", summary)).toBe(false);
    expect(checkUnlockCondition("unknown", summary)).toBe(false);
  });
});

describe("rest timer helpers", () => {
  it("detects compound exercises from muscles or body parts", () => {
    expect(detectExerciseType({ target_muscles: ["Chest"] })).toBe("compound");
    expect(detectExerciseType({ body_parts: ["Upper Legs"] })).toBe("compound");
    expect(detectExerciseType({ target_muscles: ["Biceps"] })).toBe("isolation");
    expect(REST_DURATIONS.compound).toBeGreaterThan(REST_DURATIONS.isolation);
  });
});
