import React from "react";
import { Pencil, Trash2 } from "lucide-react";

interface ExerciseListCardProps {
  exercise: {
    exercise_id: string;
    name: string;
    target_muscles: string | null;
  };
  onEdit: (exercise: { exercise_id: string; name: string; target_muscles: string | null }) => void;
  onDelete: (exercise: { exercise_id: string; name: string; target_muscles: string | null }) => void;
}

export default function ExerciseListCard({ exercise, onEdit, onDelete }: ExerciseListCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5 flex items-center gap-4 transition-all duration-200">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-[var(--foreground)] truncate" style={{ fontFamily: "var(--font-poppins)" }}>{exercise.name}</h3>
        <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{exercise.exercise_id}</p>
        {exercise.target_muscles && (
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 capitalize">{exercise.target_muscles}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(exercise)}
          className="w-9 h-9 rounded-full bg-[var(--surface-raised)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)] flex items-center justify-center transition-colors"
        >
          <Pencil className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--primary-500)]" />
        </button>
        <button
          onClick={() => onDelete(exercise)}
          className="w-9 h-9 rounded-full bg-[var(--surface-raised)] hover:bg-[var(--color-destructive-bg)] flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--color-destructive)]" />
        </button>
      </div>
    </div>
  );
}
