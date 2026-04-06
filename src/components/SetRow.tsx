import React from "react";
import { Check, X } from "lucide-react";

interface SetRowProps {
  set: { id: string; set_number: number; reps: number; weight: number };
  setIndex: number;
  exerciseIndex: number;
  isConfirmed: boolean;
  previous?: { reps: number; weight: number } | null;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onConfirmSet: (setId: string, exercise: { exercise_id: string; name: string }, workoutExerciseId: string) => void;
  exercise: { exercise_id: string; name: string };
  workoutExerciseId: string;
}

export default function SetRow({
  set,
  setIndex,
  exerciseIndex,
  isConfirmed,
  previous,
  onUpdateSet,
  onDeleteSet,
  onConfirmSet,
  exercise,
  workoutExerciseId,
}: SetRowProps) {
  return (
    <div
      className={`grid grid-cols-[2.5rem_3.5rem_1fr_1fr_5rem] items-center gap-2 px-1 py-1.5 rounded-[var(--radius-md)] transition-colors ${
        isConfirmed
          ? "bg-[var(--primary-50)] dark:bg-[var(--primary-100)]"
          : "hover:bg-[var(--surface-raised)]"
      }`}
    >
      {/* Set number */}
      <span className={`text-sm font-semibold ${isConfirmed ? "text-[var(--primary-600)] dark:text-[var(--primary-700)]" : "text-[var(--muted-foreground)]"}`}>
        {set.set_number}
      </span>

      {/* Previous session */}
      <span className="text-center text-xs font-medium tabular-nums text-[var(--muted-foreground)]">
        {previous ? `${previous.reps}×${previous.weight}` : "—"}
      </span>

      {/* Reps input */}
      <input
        type="number"
        placeholder="0"
        value={set.reps || ""}
        onChange={(e) => {
          onUpdateSet(exerciseIndex, setIndex, "reps", parseInt(e.target.value) || 0);
        }}
        min="0"
        className="w-full px-2 py-1.5 text-center bg-[var(--surface-raised)] rounded-[var(--radius-sm)] text-[var(--foreground)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] placeholder-[var(--muted-foreground)]"
      />

      {/* Weight input */}
      <input
        type="number"
        placeholder="0"
        value={set.weight || ""}
        onChange={(e) => {
          onUpdateSet(exerciseIndex, setIndex, "weight", parseFloat(e.target.value) || 0);
        }}
        min="0"
        step="0.5"
        className="w-full px-2 py-1.5 text-center bg-[var(--surface-raised)] rounded-[var(--radius-sm)] text-[var(--foreground)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] placeholder-[var(--muted-foreground)]"
      />

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 justify-end">
        <button
          aria-label="Confirm set"
          onClick={(e) => {
            e.stopPropagation();
            onConfirmSet(set.id, exercise, workoutExerciseId);
          }}
          className={`w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all ${
            isConfirmed
              ? "bg-[var(--primary-500)] text-white shadow-[0_2px_6px_rgba(59,130,246,0.3)]"
              : "bg-[var(--primary-100)] dark:bg-[var(--primary-200)] text-[var(--primary-600)] dark:text-[var(--primary-700)] hover:bg-[var(--primary-500)] hover:text-white"
          }`}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          aria-label="Delete set"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteSet(exerciseIndex, setIndex);
          }}
          className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--primary-100)] dark:bg-[var(--primary-200)] text-[var(--primary-600)] dark:text-[var(--primary-700)] hover:bg-[var(--primary-500)] hover:text-white transition-all font-bold"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
