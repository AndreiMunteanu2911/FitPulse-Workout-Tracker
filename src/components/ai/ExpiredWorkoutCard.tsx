"use client";

import { motion } from "framer-motion";
import { Dumbbell, Clock, RefreshCw } from "lucide-react";
import type { WorkoutExerciseSummary } from "@/hooks/useAIChat";

interface ExpiredWorkoutCardProps {
  workoutName: string;
  exercises: WorkoutExerciseSummary[];
  onRecreate: () => void;
}

export default function ExpiredWorkoutCard({
  workoutName,
  exercises,
  onRecreate,
}: ExpiredWorkoutCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-2 mt-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] opacity-80"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          Workout suggestion has expired
        </span>
      </div>

      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        {workoutName}
      </h4>

      {/* Exercise list */}
      <ul className="space-y-1 mb-3">
        {exercises.map((ex, i) => (
          <li key={i} className="text-xs text-[var(--muted-foreground)] flex items-start gap-2">
            <span className="font-medium mt-0.5">{i + 1}.</span>
            <div className="flex-1">
              <span className="text-[var(--foreground)] font-medium">
                {ex.name.replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span className="ml-1.5">
                {ex.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={onRecreate}
        className="w-full py-2.5 px-4 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--primary-600)]
          text-[var(--foreground)] hover:text-white text-sm font-semibold transition-colors
          flex items-center justify-center gap-2 border border-[var(--border)]"
      >
        <RefreshCw className="w-4 h-4" />
        Recreate with current data
      </button>
    </motion.div>
  );
}
