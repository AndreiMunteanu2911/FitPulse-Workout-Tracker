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

  // Show the 4 most recently unlocked badges
  const previewBadges = unlocked.slice(0, 4);
  const fillCount = Math.max(0, 4 - previewBadges.length);

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] overflow-hidden">
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        {/* Primary accent bar on the left */}
        <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-[var(--primary-500)] to-[var(--primary-400)] rounded-full" />

        {/* Icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-lg)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-500)]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--foreground)]">Achievements</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            <span className="font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)]">{unlocked.length}</span> / {total} unlocked
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
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-600)] dark:text-[var(--primary-500)] font-semibold text-xs hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-200)] transition-colors"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress bar at the bottom */}
      <div className="h-1.5 w-full bg-[var(--surface-raised)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)] transition-all duration-700 ease-out"
          style={{ width: total > 0 ? `${(unlocked.length / total) * 100}%` : "0%" }}
        />
      </div>
    </div>
  );
}
