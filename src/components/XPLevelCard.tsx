"use client";

import type { GamificationStats } from "@/types";
import { Zap, Flame } from "lucide-react";

interface XPLevelCardProps {
  gamification: GamificationStats;
}

export default function XPLevelCard({ gamification }: XPLevelCardProps) {
  const { level, totalXP, xpForCurrentLevel, xpForNextLevel, xpProgress, currentStreak } = gamification;

  const xpInLevel = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        {/* Level badge */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.4)]">
          <span className="text-white font-extrabold text-base leading-none">{level}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-[var(--foreground)]">Level {level}</span>
            <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
              {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </span>
          </div>

          {/* XP progress bar */}
          <div className="h-2.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)] transition-all duration-700 ease-out"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[var(--primary-500)]" />
          <span className="font-semibold text-[var(--foreground)]">{totalXP.toLocaleString()}</span> XP
        </span>

        {currentStreak > 0 && (
          <span className="flex items-center gap-1 ml-2">
            <Flame className="w-3.5 h-3.5 text-[var(--primary-500)]" />
            <span className="font-semibold text-[var(--foreground)]">{currentStreak}</span>
            {` day${currentStreak === 1 ? "" : "s"} streak`}
          </span>
        )}

        <span className="ml-auto">
          {(xpForNextLevel - totalXP).toLocaleString()} XP to Level {level + 1}
        </span>
      </div>
    </div>
  );
}
