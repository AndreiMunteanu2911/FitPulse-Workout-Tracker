"use client";

import Link from "next/link";
import type { Achievement } from "@/types";
import Button from "@/components/Button";
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
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary-500)] via-[var(--primary-400)] to-[var(--lime-green)]" />
      <div className="absolute -right-16 -top-16 size-40 rounded-full bg-[var(--primary-100)]/60 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)]">
              <Trophy className="size-5" />
              {hasClaimable && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lime-green)] px-1 text-[10px] font-extrabold text-[#232323] ring-2 ring-[var(--surface)]">
                  {claimable.length}
                </span>
              )}
            </div>
            <div>
              <p className="eyebrow !mb-1">Milestones</p>
              <h3 className="text-xl font-extrabold tracking-[-0.03em] text-[var(--foreground)]">Achievements</h3>
            </div>
          </div>
          <span className="rounded-full bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-bold text-[var(--muted-foreground)]">
            {progress}%
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          {hasClaimable
            ? `${claimable.length} milestone${claimable.length === 1 ? " is" : "s are"} ready to claim.`
            : `${claimed.length} of ${total} milestones claimed.`}
        </p>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {previewBadges.length > 0 ? (
          <div className="mt-5 grid grid-cols-5 gap-2">
            {previewBadges.map((achievement) => {
              const Icon = ICON_MAP[achievement.icon] ?? Trophy;
              const isReady = !!achievement.unlockedAt && !achievement.claimedAt;

              return (
                <span
                  key={achievement.id}
                  title={achievement.name}
                  className={`flex aspect-square min-w-0 items-center justify-center rounded-[var(--radius-md)] ${
                    isReady
                      ? "bg-[var(--lime-green)] text-[#232323] shadow-[0_8px_20px_rgba(197,212,74,0.18)]"
                      : "bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)]"
                  }`}
                >
                  {achievement.claimedAt
                    ? <CheckCircle2 className="size-4" />
                    : <Icon className="size-4" aria-hidden="true" />}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3 text-xs text-[var(--muted-foreground)]">
            Log workouts to unlock your first milestones.
          </p>
        )}

        <Button asChild variant={hasClaimable ? "lime" : "secondary"} block className="mt-5">
          <Link href="/achievements">
            {hasClaimable ? "Claim achievements" : "View achievements"}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
