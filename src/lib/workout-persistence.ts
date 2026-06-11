import type { WorkoutExercise } from "@/types";

export function serializeWorkoutSets(exercises: WorkoutExercise[]) {
  return exercises.flatMap((exercise) =>
    exercise.sets.map((set) => ({
      id: set.id,
      reps: set.reps,
      weight: set.weight,
      is_confirmed: set.is_confirmed,
    })),
  );
}

export async function saveWorkoutState(id: string, name: string, exercises: WorkoutExercise[]) {
  const response = await fetch(`/api/workouts/${id}/batch`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sets: serializeWorkoutSets(exercises) }),
  });
  if (!response.ok) throw new Error("Failed to save workout");
}
