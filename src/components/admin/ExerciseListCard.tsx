import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import Button from "@/components/Button";

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
    <div className="flex items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)] ring-1 ring-[var(--border)] transition-all duration-200 hover:ring-[var(--primary-200)] sm:p-5">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-[var(--foreground)] truncate" style={{ fontFamily: "var(--font-poppins)" }}>{exercise.name}</h3>
        <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{exercise.exercise_id}</p>
        {exercise.target_muscles && (
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 capitalize">{exercise.target_muscles}</p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onEdit(exercise)}
          className="!min-h-9 !px-3 !py-2 !text-xs sm:!min-h-9 sm:!px-3 sm:!py-2 sm:!text-xs"
        >
          <Pencil className="size-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => onDelete(exercise)}
          className="!min-h-9 !px-3 !py-2 !text-xs text-[var(--color-destructive)] sm:!min-h-9 sm:!px-3 sm:!py-2 sm:!text-xs"
        >
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
}
