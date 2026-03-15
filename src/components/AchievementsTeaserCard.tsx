"use client";

import Link from "next/link";
import type { Achievement } from "@/types";
import { Trophy, ArrowRight, Dumbbell, Activity, TrendingUp, Star, Award, Zap, Flame, Rocket, Target, Medal, BarChart2, Crown, type LucideIcon } from "lucide-react";
import { ChartBarIncreasing } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Activity, TrendingUp, Star, Award,
  Zap, Flame, Rocket, Trophy, Target, Medal,
  BarChart2, ChartBarIncreasing, Crown,
};

interface AchievementsTeaserCardProps {
  achievements: Achievement[];
}

export default function AchievementsTeaserCard({ achievements }: AchievementsTeaserCardProps) {
  const claimed = achievements.filter((a) => !!a.claimedAt);
  const claimable = achievements.filter((a) => !!a.unlockedAt && !a.claimedAt);
  const total = achievements.length;

  // Show the first 4 claimable badges; fall back to claimed ones if none pending
  const previewBadges = claimable.length > 0 ? claimable.slice(0, 4) : claimed.slice(0, 4);
  const hasClaimable = claimable.length > 0;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] overflow-hidden">
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        {/* Primary accent bar */}
        <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-[var(--primary-500)] to-[var(--primary-400)] rounded-full" />

        {/* Icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-lg)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center relative">
          <Trophy className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-500)]" />
          {hasClaimable && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--primary-500)] text-white text-[9px] font-bold flex items-center justify-center">
              {claimable.length}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--foreground)]">Achievements</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            <span className="font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)]">
              {claimed.length}
            </span>{" "}
            / {total} claimed
            {hasClaimable && (
              <span className="ml-1.5 font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)]">
                · {claimable.length} ready
              </span>
            )}
          </p>

          {/* Mini icon strip */}
          {previewBadges.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {previewBadges.map((a) => {
                const Icon = ICON_MAP[a.icon] ?? Trophy;
                return (
                  <span
                    key={a.id}
                    title={a.name}
                    className="w-6 h-6 rounded-full bg-[var(--primary-50)] flex items-center justify-center text-[var(--primary-500)]"
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                );
              })}
              {claimable.length > 4 && (
                <span className="text-xs text-[var(--muted-foreground)]">+{claimable.length - 4}</span>
              )}
            </div>
          )}

          {previewBadges.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5">Start earning badges</p>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/achievements"
          aria-label="View all achievements"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-600)] dark:text-[var(--primary-500)] font-semibold text-xs hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-200)] transition-colors"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-[var(--surface-raised)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)] transition-all duration-700 ease-out"
          style={{ width: total > 0 ? `${(claimed.length / total) * 100}%` : "0%" }}
        />
      </div>
    </div>
  );
}
