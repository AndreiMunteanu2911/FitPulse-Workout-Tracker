"use client";

import { useEffect, useRef, useCallback } from "react";
import type { RestTimerState } from "@/types";
import { X, SkipForward } from "lucide-react";

interface RestTimerProps {
  timer: RestTimerState;
  onTick: (remaining: number) => void;
  onSkip: () => void;
  onDismiss: () => void;
}

function CircularProgress({
  progress,
  size = 72,
  strokeWidth = 6,
  children,
}: {
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-raised)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--primary-500)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.9s linear" }}
      />
      {/* Centre text — rendered upright */}
      <foreignObject x={0} y={0} width={size} height={size} className="rotate-90">
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center"
        >
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RestTimer({ timer, onTick, onSkip, onDismiss }: RestTimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { active, duration, remaining, exerciseName, exerciseType } = timer;

  const progress = duration > 0 ? (remaining / duration) * 100 : 0;

  // Haptic feedback helper — vibration API is unsupported on many browsers/devices,
  // so we intentionally swallow any errors rather than surfacing them to the user.
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration API not available or blocked — safe to ignore
      }
    }
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!active || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      onTick(remaining - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // `onTick` is intentionally excluded from deps: it is a stable callback passed from
    // the parent and including it would cause the interval to be reset on every tick,
    // producing double-ticking behaviour.  `remaining` drives the re-run correctly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, remaining]);

  // Fire haptic when done
  useEffect(() => {
    if (active && remaining === 0) {
      vibrate([200, 100, 200]);
    }
  }, [active, remaining, vibrate]);

  if (!active) return null;

  const isDone = remaining === 0;
  const label = exerciseType === "compound" ? "Compound rest" : "Isolation rest";

  return (
    /* Floating card — sits just above the bottom nav on mobile */
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg,0_8px_32px_rgba(0,0,0,0.25))] p-4 flex items-center gap-4">
        {/* Circular countdown */}
        <div className="flex-shrink-0">
          <CircularProgress progress={progress} size={72} strokeWidth={6}>
            <span
              className={`text-sm font-bold tabular-nums ${
                isDone
                  ? "text-[var(--color-success)]"
                  : remaining <= 10
                  ? "text-[var(--color-destructive)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {isDone ? "Go!" : formatTime(remaining)}
            </span>
          </CircularProgress>
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            {isDone ? "Rest complete" : label}
          </p>
          <p className="text-sm font-bold text-[var(--foreground)] truncate capitalize mt-0.5">
            {exerciseName}
          </p>
          {!isDone && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {exerciseType === "compound" ? "3 min rest" : "90 s rest"}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {!isDone ? (
            <button
              onClick={onSkip}
              aria-label="Skip rest"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-600)] dark:text-[var(--primary-700)] hover:brightness-95 transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={onDismiss}
            aria-label="Dismiss timer"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
