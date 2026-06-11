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
  const xpRemaining = Math.max(0, xpForNextLevel - totalXP);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--primary-500)] p-5 text-white shadow-[0_18px_42px_rgba(116,87,245,0.24)] sm:p-6">
      <div className="absolute -right-12 -top-16 size-44 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 left-16 size-40 rounded-full bg-[var(--lime-green)]/15 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Training level</p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">Level {level}</h3>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-white/10 shadow-inner ring-1 ring-white/15">
            <span className="text-2xl font-black leading-none">{level}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="text-white/70">Next level</span>
            <span className="tabular-nums text-white/85">
              {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/15 ring-1 ring-white/10">
            <div
              className="h-full rounded-full bg-[var(--lime-green)] shadow-[0_0_18px_rgba(226,241,99,0.35)] transition-all duration-700 ease-out"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-lg)] bg-white/10 p-3 ring-1 ring-white/10">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
              <Zap className="size-3.5 text-[var(--lime-green)]" />
              Total XP
            </p>
            <p className="mt-1 text-lg font-extrabold">{totalXP.toLocaleString()}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-white/10 p-3 ring-1 ring-white/10">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
              {currentStreak > 0 ? <Flame className="size-3.5 text-[var(--lime-green)]" /> : <Star className="size-3.5 text-[var(--lime-green)]" />}
              {currentStreak > 0 ? "Current streak" : "To next level"}
            </p>
            <p className="mt-1 text-lg font-extrabold">
              {currentStreak > 0 ? `${currentStreak} day${currentStreak === 1 ? "" : "s"}` : `${xpRemaining.toLocaleString()} XP`}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-white/60">
          {xpRemaining.toLocaleString()} XP remaining until Level {level + 1}
        </p>
      </div>
    </div>
  );
}
