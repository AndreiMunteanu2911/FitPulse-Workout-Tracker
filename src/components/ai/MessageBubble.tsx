"use client";

import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import Image from "next/image";
import ExpiredWorkoutCard from "./ExpiredWorkoutCard";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isExpired?: boolean;
  onWorkoutStart?: () => void;
  onWorkoutRecreate?: () => void;
  workoutName?: string;
  workoutExercises?: { name: string; sets: { reps: number; weight: number }[] }[];
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
  isExpired = false,
  onWorkoutStart,
  onWorkoutRecreate,
  workoutName,
  workoutExercises,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-[var(--primary-600)] text-white"
            : "bg-[var(--primary-100)] dark:bg-[var(--primary-900)]"
        }`}
      >
        {isUser ? (
          <span className="text-xs font-bold">You</span>
        ) : (
          <Image src="/assets/dumbbell-large.svg" alt="AI" width={18} height={18} className="brightness-0 invert" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--primary-600)] text-white rounded-tr-sm"
            : "bg-[var(--surface-raised)] text-[var(--foreground)] rounded-tl-sm"
        }`}
      >
        {content ? (
          <div className="whitespace-pre-wrap break-words">
            <FormattedText content={content} />
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
            <span className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : null}
      </div>

      {/* Expired workout card (shown for old conversations) */}
      {!isUser && isExpired && workoutName && workoutExercises && (
        <ExpiredWorkoutCard
          workoutName={workoutName}
          exercises={workoutExercises}
          onRecreate={onWorkoutRecreate ?? (() => {})}
        />
      )}
    </motion.div>
  );
}

// ── Workout Action Card ─────────────────────────────────────────────────────
export interface WorkoutExerciseSummary {
  name: string;
  sets: { reps: number; weight: number }[];
}

export function WorkoutActionCard({
  workoutName,
  exercises,
  onStart,
}: {
  workoutName: string;
  exercises: WorkoutExerciseSummary[];
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-2 mt-2 p-4 rounded-xl border border-[var(--primary-500)] bg-[var(--primary-50)] dark:bg-[var(--primary-950)]"
    >
      <div className="flex items-center gap-2 mb-2">
        <Dumbbell className="w-5 h-5 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
        <span className="text-sm font-semibold text-[var(--primary-700)] dark:text-[var(--primary-300)]">
          {workoutName}
        </span>
      </div>

      {/* Exercise list */}
      <ul className="space-y-1.5 mb-3">
        {exercises.map((ex, i) => (
          <li key={i} className="text-xs text-[var(--foreground)] flex items-start gap-2">
            <span className="text-[var(--primary-600)] dark:text-[var(--primary-400)] font-medium mt-0.5">
              {i + 1}.
            </span>
            <div className="flex-1">
              <span className="font-medium">{ex.name.replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              <span className="text-[var(--muted-foreground)] ml-1.5">
                {ex.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={onStart}
        className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <Dumbbell className="w-4 h-4" />
        Start Workout
      </button>
    </motion.div>
  );
}

// ── Simple text formatter ───────────────────────────────────────────────────
function FormattedText({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);

        const formatted = parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        });

        return (
          <span key={i}>
            {formatted}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}
