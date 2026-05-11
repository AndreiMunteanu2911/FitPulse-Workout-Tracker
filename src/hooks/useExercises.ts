"use client";
import { useCallback } from "react";
import { apiFetch } from "@/services/api/apiFetch";
import type { Exercise } from "@/types";

export function useExercises() {
  const fetchExercises = useCallback(async (page: number, search: string) => {
    const params = new URLSearchParams({ page: String(page), search });
    return apiFetch<{ exercises: Exercise[]; hasMore: boolean }>(`/api/exercises?${params}`);
  }, []);

  const fetchExercise = useCallback(async (id: string) => {
    const data = await apiFetch<{ exercise: Exercise }>(`/api/exercises/${id}`);
    return data.exercise;
  }, []);

  const searchExercises = useCallback(async (query: string, limit = 10) => {
    const params = new URLSearchParams({ search: query, page: "0" });
    const data = await apiFetch<{ exercises: Exercise[] }>(`/api/exercises?${params}`);
    return data.exercises.slice(0, limit);
  }, []);

  return { fetchExercises, fetchExercise, searchExercises };
}
