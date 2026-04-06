import React from "react";

interface TopExercisesListProps {
  exercises: { exercise_id: string; count: number }[];
}

export default function TopExercisesList({ exercises }: TopExercisesListProps) {
  if (exercises.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-4">Most Used Exercises</h2>
        <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No exercise data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
      <h2 className="text-base font-bold text-[var(--foreground)] mb-4">Most Used Exercises</h2>
      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={ex.exercise_id} className="flex items-center gap-4">
            <span className="text-sm font-bold text-[var(--muted-foreground)] w-6 text-center">{idx + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{ex.exercise_id}</p>
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{ex.count} uses</span>
          </div>
        ))}
      </div>
    </div>
  );
}
