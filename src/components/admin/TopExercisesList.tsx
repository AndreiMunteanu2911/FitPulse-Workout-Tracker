import React from "react";

interface TopExercisesListProps {
  exercises: { exercise_id: string; name: string; count: number }[];
}

export default function TopExercisesList({ exercises }: TopExercisesListProps) {
  if (exercises.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] sm:p-6">
        <p className="eyebrow">Exercise usage</p>
        <h2 className="mb-4 text-lg font-extrabold text-[var(--foreground)]">Most used exercises</h2>
        <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No exercise data yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] sm:p-6">
      <p className="eyebrow">Exercise usage</p>
      <h2 className="mb-5 text-lg font-extrabold text-[var(--foreground)]">Most used exercises</h2>
      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={ex.exercise_id} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--primary-50)] text-xs font-extrabold text-[var(--primary-600)]">{idx + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">{ex.name}</p>
            </div>
            <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--muted-foreground)]">{ex.count} uses</span>
          </div>
        ))}
      </div>
    </section>
  );
}
