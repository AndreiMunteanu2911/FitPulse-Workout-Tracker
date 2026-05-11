"use client";

import Link from "next/link";
import type { Achievement } from "@/types";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart2,
  CheckCircle2,
  Crown,
  Dumbbell,
  Flame,
  Medal,
  Rocket,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ChartBarIncreasing } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  Activity,
  TrendingUp,
  Star,
  Award,
  Zap,
  Flame,
  Rocket,
  Trophy,
  Target,
  Medal,
  BarChart2,
  ChartBarIncreasing,
  Crown,
};

interface AchievementsTeaserCardProps {
  achievements: Achievement[];
}

export default function AchievementsTeaserCard({ achievements }: AchievementsTeaserCardProps) {
  const claimed = achievements.filter((achievement) => !!achievement.claimedAt);
  const claimable = achievements.filter((achievement) => !!achievement.unlockedAt && !achievement.claimedAt);
  const total = achievements.length;
  const progress = total > 0 ? Math.round((claimed.length / total) * 100) : 0;
  const previewBadges = (claimable.length > 0 ? claimable : claimed).slice(0, 5);
  const hasClaimable = claimable.length > 0;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-600)]">
          <Trophy className="h-6 w-6" />
          {hasClaimable && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lime-green)] px-1 text-[10px] font-extrabold text-[#232323]">
              {claimable.length}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
                Achievements
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {claimed.length} of {total} claimed
                {hasClaimable && <span className="font-semibold text-[var(--primary-600)]"> · {claimable.length} ready</span>}
              </p>
            </div>
            <Link
              href="/achievements"
              aria-label="View all achievements"
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors hover:bg-[var(--primary-50)] hover:text-[var(--primary-600)]"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--muted-foreground)]">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {previewBadges.length > 0 ? (
            <div className="mt-4 flex items-center gap-2 overflow-hidden">
              {previewBadges.map((achievement) => {
                const Icon = ICON_MAP[achievement.icon] ?? Trophy;
                const isReady = !!achievement.unlockedAt && !achievement.claimedAt;
                return (
                  <span
                    key={achievement.id}
                    title={achievement.name}
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${
                      isReady
                        ? "border-[var(--lime-green)] bg-[var(--lime-green)] text-[#232323]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--primary-600)]"
                    }`}
                  >
                    {achievement.claimedAt ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">Log workouts to unlock your first badges.</p>
          )}
        </div>
      </div>
    </div>
  );
}
