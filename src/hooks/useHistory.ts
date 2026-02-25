"use client";

export function useHistory() {
  const fetchHistory = async () => {
    const res = await fetch("/api/workouts");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch history");
    return data.workouts;
  };

  const fetchWorkoutDetail = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch workout");
    return data.workout;
  };

  return { fetchHistory, fetchWorkoutDetail };
}
