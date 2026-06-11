import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SetRowProps {
  set: { id: string; set_number: number; reps: number; weight: number };
  setIndex: number;
  exerciseIndex: number;
  isConfirmed: boolean;
  previous?: { reps: number; weight: number } | null;
  previousLoading?: boolean;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onConfirmSet: (setId: string, exercise: { exercise_id: string; name: string }, workoutExerciseId: string) => void;
  exercise: { exercise_id: string; name: string };
  workoutExerciseId: string;
}

function NumericSetInput({
  value,
  kind,
  onChange,
}: {
  value: number;
  kind: "reps" | "weight";
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(value > 0 ? String(value) : "");

  useEffect(() => {
    setText(value > 0 ? String(value) : "");
  }, [value]);

  const isValid = (next: string) => {
    if (kind === "reps") {
      return /^\d{0,4}$/.test(next) && (next === "" || Number(next) <= 1000);
    }
    return /^\d{0,6}(?:\.\d{0,2})?$/.test(next) &&
      (next === "" || next === "." || Number(next) <= 100000);
  };

  return (
    <input
      type="text"
      inputMode={kind === "reps" ? "numeric" : "decimal"}
      pattern={kind === "reps" ? "[0-9]*" : "[0-9]*[.]?[0-9]*"}
      aria-label={kind === "reps" ? "Repetitions" : "Weight"}
      placeholder="0"
      value={text}
      onChange={(event) => {
        const next = event.target.value.replace(",", ".");
        if (!isValid(next)) return;
        setText(next);
        onChange(next === "" || next === "." ? 0 : Number(next));
      }}
      onBlur={() => setText(value > 0 ? String(value) : "")}
      className="w-full rounded-[var(--radius-sm)] bg-[var(--surface-raised)] px-2 py-1.5 text-center text-sm font-semibold text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
    />
  );
}

export default function SetRow({
  set,
  setIndex,
  exerciseIndex,
  isConfirmed,
  previous,
  previousLoading,
  onUpdateSet,
  onDeleteSet,
  onConfirmSet,
  exercise,
  workoutExerciseId,
}: SetRowProps) {
  return (
    <motion.div
      layout
      animate={{ scale: isConfirmed ? 1.01 : 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={`grid grid-cols-[2.5rem_3.5rem_1fr_1fr_5rem] items-center gap-2 px-4 py-1.5 rounded-[var(--radius-sm)] transition-colors ${
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
        {previousLoading
          ? "..."
          : previous
            ? `${previous.reps}×${previous.weight}`
            : "—"
        }
      </span>

      {/* Reps input */}
      <NumericSetInput
        value={set.reps}
        kind="reps"
        onChange={(value) => onUpdateSet(exerciseIndex, setIndex, "reps", value)}
      />

      {/* Weight input */}
      <NumericSetInput
        value={set.weight}
        kind="weight"
        onChange={(value) => onUpdateSet(exerciseIndex, setIndex, "weight", value)}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 justify-end">
        <button
          aria-label="Confirm set"
          onClick={(e) => {
            e.stopPropagation();
            onConfirmSet(set.id, exercise, workoutExerciseId);
          }}
          className={`w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center font-bold transition-all ${
            isConfirmed
              ? "bg-[var(--primary-500)] text-white"
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
          className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)] transition-all font-bold"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
