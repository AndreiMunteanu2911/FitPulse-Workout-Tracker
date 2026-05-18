import { beforeEach, describe, expect, it } from "vitest";
import { useWorkoutStore } from "@/stores/workoutStore";
import type { Exercise, Workout } from "@/types";

const exercise: Exercise = {
  exercise_id: "bench-press",
  name: "Bench Press",
};

function workout(): Workout {
  return {
    id: "workout-1",
    name: "Push",
    workout_date: "2026-05-18",
    status: "draft",
    workout_exercises: [],
  };
}

describe("useWorkoutStore", () => {
  beforeEach(() => {
    useWorkoutStore.getState().clearActiveWorkout();
  });

  it("sets and clears the active workout", () => {
    useWorkoutStore.getState().setActiveWorkout(workout());
    expect(useWorkoutStore.getState().isWorkoutActive).toBe(true);

    useWorkoutStore.getState().clearActiveWorkout();
    expect(useWorkoutStore.getState().activeWorkout).toBeNull();
    expect(useWorkoutStore.getState().isWorkoutActive).toBe(false);
  });

  it("adds exercises with an initial set", () => {
    useWorkoutStore.getState().setActiveWorkout(workout());
    useWorkoutStore.getState().addExercise(exercise);

    const active = useWorkoutStore.getState().activeWorkout;
    expect(active?.workout_exercises).toHaveLength(1);
    expect(active?.workout_exercises[0]).toMatchObject({
      exercise_id: "bench-press",
      order_index: 0,
      sets: [{ set_number: 1, reps: 0, weight: 0, is_confirmed: false }],
    });
  });

  it("adds, updates, removes, and renumbers sets", () => {
    useWorkoutStore.getState().setActiveWorkout(workout());
    useWorkoutStore.getState().addExercise(exercise);
    useWorkoutStore.getState().addSet(0);
    useWorkoutStore.getState().updateSet(0, 1, "reps", 8);
    useWorkoutStore.getState().updateSet(0, 1, "weight", 100);

    expect(useWorkoutStore.getState().activeWorkout?.workout_exercises[0].sets[1]).toMatchObject({
      set_number: 2,
      reps: 8,
      weight: 100,
    });

    useWorkoutStore.getState().removeSet(0, 0);
    expect(useWorkoutStore.getState().activeWorkout?.workout_exercises[0].sets).toEqual([
      expect.objectContaining({ set_number: 1, reps: 8, weight: 100 }),
    ]);
  });

  it("removes exercises and keeps order indexes contiguous", () => {
    useWorkoutStore.getState().setActiveWorkout(workout());
    useWorkoutStore.getState().addExercise(exercise);
    useWorkoutStore.getState().addExercise({ exercise_id: "row", name: "Row" });
    useWorkoutStore.getState().removeExercise(0);

    expect(useWorkoutStore.getState().activeWorkout?.workout_exercises).toEqual([
      expect.objectContaining({ exercise_id: "row", order_index: 0 }),
    ]);
  });

  it("updates the workout name", () => {
    useWorkoutStore.getState().setActiveWorkout(workout());
    useWorkoutStore.getState().updateWorkoutName("Upper body");

    expect(useWorkoutStore.getState().activeWorkout?.name).toBe("Upper body");
  });
});
