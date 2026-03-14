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

  const renameWorkout = async (id: string, name: string) => {
    const res = await fetch(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to rename workout");
    return data.workout;
  };

  const deleteWorkout = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete workout");
    return data;
  };

  return { fetchHistory, fetchWorkoutDetail, renameWorkout, deleteWorkout };
}
