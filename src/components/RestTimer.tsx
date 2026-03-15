"use client";

import { useEffect, useRef, useCallback } from "react";
import type { RestTimerState } from "@/types";
import { Check, X, Timer } from "lucide-react";

interface RestTimerRowProps {
  timer: RestTimerState;
  onTick: (remaining: number) => void;
  onSkip: () => void;
  onDismiss: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Inline rest-timer row rendered inside the exercise sets list. */
export default function RestTimer({ timer, onTick, onSkip, onDismiss }: RestTimerRowProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { active, remaining } = timer;

  // Haptic feedback
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(pattern); } catch { /* not available */ }
    }
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Auto-skip after a brief "Done!" moment
      const t = setTimeout(onSkip, 1200);
      return () => clearTimeout(t);
    }

    intervalRef.current = setInterval(() => {
      onTick(remaining - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // `onTick` and `onSkip` are stable callbacks; `remaining` drives re-runs correctly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, remaining]);

  // Haptic when done
  useEffect(() => {
    if (active && remaining === 0) vibrate([200, 100, 200]);
  }, [active, remaining, vibrate]);

  if (!active) return null;

  const isDone = remaining === 0;

  return (
    <div
      className={`grid grid-cols-[3rem_1fr_1fr_5rem] items-center gap-2 px-1 py-2 rounded-[var(--radius-md)] transition-colors ${
        isDone
          ? "bg-[var(--primary-50)] dark:bg-[var(--primary-100)]"
          : "bg-[var(--primary-50)] dark:bg-[var(--primary-100)]"
      }`}
    >
      {/* Timer icon */}
      <span className="flex items-center justify-center">
        <Timer className="w-4 h-4 text-[var(--primary-500)]" />
      </span>

      {/* Countdown */}
      <span
        className={`col-span-2 text-sm font-bold tabular-nums text-center ${
          isDone ? "text-[var(--primary-600)]" : "text-[var(--primary-600)] dark:text-[var(--primary-500)]"
        }`}
      >
        {isDone ? "Rest done!" : `Rest  ${formatTime(remaining)}`}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 justify-end">
        {!isDone && (
          <button
            onClick={onSkip}
            aria-label="Skip rest"
            title="Skip rest"
            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--primary-600)] dark:text-[var(--primary-500)] hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-200)] transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss rest timer"
          title="Dismiss"
          className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
