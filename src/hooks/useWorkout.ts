"use client";

import { useCallback } from "react";
import { apiFetch } from "@/services/api/apiFetch";
import type { Set as WorkoutSet, Workout } from "@/types";

function isMissingSetError(error: unknown): boolean {
  return error instanceof Error && error.message === "Set not found or unauthorized";
}

export function useWorkout() {
  const getDraftWorkout = useCallback(async () => {
    const data = await apiFetch<{ workout: Workout | null }>("/api/workouts/draft");
    return data.workout;
  }, []);

  const startWorkout = useCallback(async (name: string) => {
    const data = await apiFetch<{ workout: Workout }>("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return data.workout;
  }, []);

  const updateWorkout = useCallback(async (id: string, updates: { name?: string; status?: string }) => {
    await apiFetch(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    await apiFetch(`/api/workouts/${id}`, { method: "DELETE" });
  }, []);

  const addExerciseToWorkout = useCallback(async (workoutId: string, exerciseId: string, orderIndex: number) => {
    return apiFetch<{ workoutExercise: Workout["workout_exercises"][number]; set: WorkoutSet }>(`/api/workouts/${workoutId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise_id: exerciseId, order_index: orderIndex }),
    });
  }, []);

  const deleteWorkoutExercise = useCallback(async (id: string) => {
    await apiFetch(`/api/workout-exercises/${id}`, { method: "DELETE" });
  }, []);

  const addSet = useCallback(async (workoutExerciseId: string, setNumber: number) => {
    const data = await apiFetch<{ set: WorkoutSet }>("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_exercise_id: workoutExerciseId, set_number: setNumber, reps: 0, weight: 0 }),
    });
    return data.set;
  }, []);

  const updateSet = useCallback(async (id: string, updates: { reps?: number; weight?: number }) => {
    try {
      await apiFetch(`/api/sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      if (isMissingSetError(error)) return;
      throw error;
    }
  }, []);

  const deleteSet = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/sets/${id}`, { method: "DELETE" });
    } catch (error) {
      if (isMissingSetError(error)) return;
      throw error;
    }
  }, []);

  return {
    getDraftWorkout,
    startWorkout,
    updateWorkout,
    deleteWorkout,
    addExerciseToWorkout,
    deleteWorkoutExercise,
    addSet,
    updateSet,
    deleteSet,
  };
}
