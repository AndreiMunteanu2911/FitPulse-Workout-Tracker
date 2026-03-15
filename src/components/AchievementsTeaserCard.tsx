"use client";

import Link from "next/link";
import type { Achievement } from "@/types";
import { Trophy, ArrowRight } from "lucide-react";

interface AchievementsTeaserCardProps {
  achievements: Achievement[];
}

export default function AchievementsTeaserCard({ achievements }: AchievementsTeaserCardProps) {
  const unlocked = achievements.filter((a) => !!a.unlockedAt);
  const total = achievements.length;

  // Show the 4 most recently unlocked badges (or first 4 for now)
  const previewBadges = unlocked.slice(0, 4);
  // Fill with a placeholder count if none are unlocked yet
  const fillCount = Math.max(0, 4 - previewBadges.length);

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] overflow-hidden">
      {/* Amber accent bar on the left */}
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        <div className="absolute left-0 inset-y-0 w-1 bg-amber-400 rounded-full" />

        {/* Icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-lg)] bg-amber-50 dark:bg-amber-100 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-amber-500" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--foreground)]">Achievements</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            <span className="font-semibold text-amber-500">{unlocked.length}</span> / {total} unlocked
          </p>

          {/* Mini badge strip */}
          <div className="flex items-center gap-1 mt-2">
            {previewBadges.map((a) => (
              <span
                key={a.id}
                className="text-xl leading-none"
                role="img"
                aria-label={a.name}
                title={a.name}
              >
                {a.icon}
              </span>
            ))}
            {fillCount > 0 && (
              <span className="text-xs text-[var(--muted-foreground)] ml-1">
                {unlocked.length === 0 ? "Start earning badges" : `+${fillCount} more`}
              </span>
            )}
          </div>
        </div>

        {/* CTA button */}
        <Link
          href="/achievements"
          aria-label="View all achievements"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] bg-amber-50 dark:bg-amber-100 text-amber-600 dark:text-amber-700 font-semibold text-xs hover:bg-amber-100 dark:hover:bg-amber-200 transition-colors"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress bar at the bottom */}
      <div className="h-1.5 w-full bg-[var(--surface-raised)]">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
          style={{ width: total > 0 ? `${(unlocked.length / total) * 100}%` : "0%" }}
        />
      </div>
    </div>
  );
}
