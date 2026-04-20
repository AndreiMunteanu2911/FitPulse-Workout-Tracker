"use client";

import type { GamificationStats } from "@/types";
import { Zap, Flame, Star } from "lucide-react";

interface XPLevelCardProps {
  gamification: GamificationStats;
}

export default function XPLevelCard({ gamification }: XPLevelCardProps) {
  const { level, totalXP, xpForCurrentLevel, xpForNextLevel, xpProgress, currentStreak } = gamification;

  const xpInLevel = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 sm:p-6">
      <div className="flex items-center gap-4 mb-4">
        {/* Level badge */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center">
          <span className="text-white font-extrabold text-xl leading-none">{level}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>Level {level}</span>
            <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
              {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </span>
          </div>

          {/* XP progress bar */}
          <div className="h-3 rounded-full bg-[var(--surface-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)] transition-all duration-700 ease-out"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[var(--primary-500)]" />
          <span className="font-semibold text-[var(--foreground)]">{totalXP.toLocaleString()}</span> XP
        </span>

        {currentStreak > 0 && (
          <span className="flex items-center gap-1.5 border-l border-[var(--border)] pl-4">
            <Flame className="w-4 h-4 text-[var(--lime-green)]" />
            <span className="font-semibold text-[var(--foreground)]">{currentStreak}</span>
            {` day${currentStreak === 1 ? "" : "s"} streak`}
          </span>
        )}

        <span className="ml-auto text-right">
          {(xpForNextLevel - totalXP).toLocaleString()} XP to Level {level + 1}
        </span>
      </div>
    </div>
  );
}