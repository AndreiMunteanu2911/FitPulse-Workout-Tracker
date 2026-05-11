"use client";

import { useCallback } from "react";
import { apiFetch } from "@/services/api/apiFetch";
import type { Post, Workout } from "@/types";

export function useHistory() {
  const fetchHistory = useCallback(async () => {
    const data = await apiFetch<{ workouts: Workout[] }>("/api/workouts");
    return data.workouts;
  }, []);

  const fetchWorkoutDetail = useCallback(async (id: string) => {
    const data = await apiFetch<{ workout: Workout }>(`/api/workouts/${id}`);
    return data.workout;
  }, []);

  const renameWorkout = useCallback(async (id: string, name: string) => {
    const data = await apiFetch<{ workout: Workout }>(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return data.workout;
  }, []);

  const deleteWorkout = useCallback(async (id: string) => apiFetch(`/api/workouts/${id}`, { method: "DELETE" }), []);

  const shareWorkout = useCallback(async (workoutId: string) => {
    const data = await apiFetch<{ post: Post }>("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_id: workoutId }),
    });
    return data.post;
  }, []);

  return { fetchHistory, fetchWorkoutDetail, renameWorkout, deleteWorkout, shareWorkout };
}
