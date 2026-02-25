"use client";

export function useWorkout() {
  const getDraftWorkout = async () => {
    const res = await fetch("/api/workouts/draft");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch draft");
    return data.workout;
  };

  const startWorkout = async (name: string) => {
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to start workout");
    return data.workout;
  };

  const updateWorkout = async (id: string, updates: { name?: string; status?: string }) => {
    const res = await fetch(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update workout");
  };

  const deleteWorkout = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete workout");
  };

  const addExerciseToWorkout = async (workoutId: string, exerciseId: string, orderIndex: number) => {
    const res = await fetch(`/api/workouts/${workoutId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise_id: exerciseId, order_index: orderIndex }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add exercise");
    return data as { workoutExercise: unknown; set: unknown };
  };

  const deleteWorkoutExercise = async (id: string) => {
    const res = await fetch(`/api/workout-exercises/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete exercise");
  };

  const addSet = async (workoutExerciseId: string, setNumber: number) => {
    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_exercise_id: workoutExerciseId, set_number: setNumber, reps: 0, weight: 0 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add set");
    return data.set;
  };

  const updateSet = async (id: string, updates: { reps?: number; weight?: number }) => {
    const res = await fetch(`/api/sets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update set");
  };

  const deleteSet = async (id: string) => {
    const res = await fetch(`/api/sets/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete set");
  };

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
