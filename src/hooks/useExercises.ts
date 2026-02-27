"use client";
import { useCallback } from "react";

export function useExercises() {
  const fetchExercises = useCallback(async (page: number, search: string) => {
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(`/api/exercises?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch exercises");
    return data as { exercises: unknown[]; hasMore: boolean };
  }, []);

  const fetchExercise = useCallback(async (id: string) => {
    const res = await fetch(`/api/exercises/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch exercise");
    return data.exercise;
  }, []);

  const searchExercises = useCallback(async (query: string, limit = 10) => {
    const params = new URLSearchParams({ search: query, page: "0" });
    const res = await fetch(`/api/exercises?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to search exercises");
    return (data.exercises as unknown[]).slice(0, limit);
  }, []);

  return { fetchExercises, fetchExercise, searchExercises };
}
