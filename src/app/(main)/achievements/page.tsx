"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import Button from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import type { Achievement } from "@/types";
import {
  Activity,
  Award,
  BarChart2,
  Check,
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

type CategoryKey = Achievement["category"];

const CATEGORY_META: Record<CategoryKey, { label: string; description: string; icon: LucideIcon }> = {
  workouts: { label: "Workouts", description: "Consistency across completed training sessions.", icon: Dumbbell },
  streaks: { label: "Streaks", description: "Momentum earned by showing up regularly.", icon: Flame },
  records: { label: "Records", description: "Personal bests and standout performances.", icon: Trophy },
  volume: { label: "Volume", description: "Milestones based on the work you have moved.", icon: BarChart2 },
};

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Trophy;
  return <Icon className={className} aria-hidden="true" />;
}

function AchievementBadge({
  achievement,
  onClaim,
  claiming,
}: {
  achievement: Achievement;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const isUnlocked = !!achievement.unlockedAt;
  const isClaimed = !!achievement.claimedAt;
  const isClaimable = isUnlocked && !isClaimed;

  return (
    <motion.div
      layout
      title={achievement.description}
      className={`relative overflow-hidden rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-xs)] ring-1 transition-all duration-200 ${
        isClaimed
          ? "bg-[var(--surface)] ring-[var(--border)]"
          : isClaimable
            ? "bg-gradient-to-br from-[var(--surface)] to-[var(--primary-50)] ring-[var(--lime-green)] shadow-[0_12px_30px_rgba(116,87,245,0.10)]"
            : "bg-[var(--surface-raised)] ring-transparent"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${
        isClaimable
          ? "bg-[var(--lime-green)]"
          : isClaimed
            ? "bg-[var(--primary-500)]"
            : "bg-[var(--border)]"
      }`} />
      <AnimatePresence initial={false}>
      {claiming && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface)]/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <LoadingSpinner size={5} variant="image" />
        </motion.div>
      )}
      </AnimatePresence>

      <div className="flex items-start gap-3">
        <div
          className={`flex size-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${
            isClaimable
              ? "bg-[var(--lime-green)] text-[#232323]"
              : isClaimed
                ? "bg-[var(--primary-50)] text-[var(--primary-600)]"
                : "bg-[var(--surface)] text-[var(--muted-foreground)]"
          }`}
        >
          <AchievementIcon name={achievement.icon} className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-snug text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
              {achievement.name}
            </h3>
            <AnimatePresence initial={false}>
              {isClaimed && (
                <motion.span
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary-50)] px-2.5 py-1.5 text-xs font-bold text-[var(--primary-600)] dark:bg-[var(--primary-100)]"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.16 }}
                >
                  <Check className="size-3.5" />
                  Claimed
                </motion.span>
              )}
            </AnimatePresence>
            {!isClaimed && (
              <span className="flex-shrink-0 rounded-full bg-[var(--primary-50)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary-600)] dark:bg-[var(--primary-100)]">
                {achievement.xpReward} XP
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {achievement.description}
          </p>
        </div>
      </div>

      {!isClaimed && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isClaimable ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
          }`}>
            {isClaimable ? "Ready to claim" : "Locked"}
          </span>

          <AnimatePresence initial={false}>
          {isClaimable && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.14 }}
            >
              <Button
                variant="lime"
                onClick={() => onClaim(achievement.id)}
                disabled={claiming}
                className="!min-h-8 !px-3 !py-2 !text-xs sm:!min-h-8 sm:!px-3 sm:!py-2 sm:!text-xs"
              >
                Claim
              </Button>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function CategorySection({
  category,
  achievements,
  onClaim,
  claimingId,
}: {
  category: CategoryKey;
  achievements: Achievement[];
  onClaim: (id: string) => void;
  claimingId: string | null;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const claimed = achievements.filter((achievement) => !!achievement.claimedAt).length;
  const claimable = achievements.filter((achievement) => !!achievement.unlockedAt && !achievement.claimedAt).length;
  const progress = achievements.length > 0 ? (claimed / achievements.length) * 100 : 0;

  return (
    <motion.section
      layout
      className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="absolute -right-20 -top-20 size-48 rounded-full bg-[var(--primary-50)] blur-3xl dark:bg-[var(--primary-100)]/50" />
      <div className="relative mb-5 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] text-white shadow-[0_10px_24px_rgba(116,87,245,0.20)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
              {meta.label}
            </h2>
            <span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-bold text-[var(--muted-foreground)]">
              {claimed}/{achievements.length}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">{meta.description}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            {claimable > 0 ? `${claimable} ready to claim` : claimed === achievements.length ? "All claimed" : `${achievements.length - claimed} remaining`}
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-3 lg:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onClaim={onClaim}
            claiming={claimingId === achievement.id}
          />
        ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/achievements")
      .then((response) => (response.ok ? response.json() : Promise.reject(response.statusText)))
      .then((data) => setAchievements(data.achievements || []))
      .catch((err) => setError(typeof err === "string" ? err : "Failed to load achievements"))
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = useCallback(async (achievementId: string) => {
    setClaimingId(achievementId);
    setClaimError(null);
    try {
      const response = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Claim failed");
      }

      const result = (await response.json()) as {
        achievementId: string;
        claimedAt: string;
      };

      setAchievements((prev) =>
        prev.map((achievement) =>
          achievement.id === result.achievementId
            ? { ...achievement, claimedAt: result.claimedAt }
            : achievement,
        ),
      );
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setClaimingId(null);
    }
  }, []);

  const categories: CategoryKey[] = ["workouts", "streaks", "records", "volume"];
  const totalClaimed = achievements.filter((achievement) => !!achievement.claimedAt).length;
  const totalAchievements = achievements.length;
  const claimableCount = achievements.filter((achievement) => !!achievement.unlockedAt && !achievement.claimedAt).length;
  const progress = totalAchievements > 0 ? Math.round((totalClaimed / totalAchievements) * 100) : 0;

  return (
    <ProtectedWrapper>
      <div className="page-stack">
        <PageHeader
          title="Achievements"
          backHref="/dashboard"
          description={
            <>
                {loading ? "Loading your progress..." : `${totalClaimed} of ${totalAchievements} claimed`}
                {!loading && claimableCount > 0 && <span className="font-semibold text-[var(--primary-600)]"> · {claimableCount} ready</span>}
            </>
          }
        />

        {loading && (
          <div className="flex min-h-[18rem] items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-destructive-bg)] p-5 text-center text-sm font-semibold text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        {!loading && !error && (
          <LoadReveal className="page-stack">
            <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--primary-500)] p-6 text-white shadow-[0_20px_50px_rgba(116,87,245,0.25)] sm:p-8">
              <div className="absolute -right-16 -top-24 size-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-[var(--lime-green)]/15 blur-3xl" />

              <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-white/10 ring-1 ring-white/15">
                      <Award className="size-5 text-[var(--lime-green)]" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Milestone collection</p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Your achievement progress</h2>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <p className="text-sm font-medium text-white/65">Keep training to unlock and claim every milestone.</p>
                    <p className="text-3xl font-black tabular-nums text-[var(--lime-green)]">{progress}%</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/15 ring-1 ring-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--lime-green)] shadow-[0_0_20px_rgba(226,241,99,0.35)] transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[19rem] sm:gap-3">
                  <div className="rounded-[var(--radius-lg)] bg-white/10 px-3 py-3 ring-1 ring-white/10">
                    <p className="text-xl font-extrabold">{totalAchievements}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/55">Total</p>
                  </div>
                  <div className="rounded-[var(--radius-lg)] bg-white/10 px-3 py-3 ring-1 ring-white/10">
                    <p className="text-xl font-extrabold">{totalClaimed}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/55">Claimed</p>
                  </div>
                  <div className="rounded-[var(--radius-lg)] bg-[var(--lime-green)] px-3 py-3 text-[#232323]">
                    <p className="text-xl font-extrabold">{claimableCount}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#232323]/60">Ready</p>
                  </div>
                </div>
              </div>
            </section>

            <AnimatePresence initial={false}>
            {claimError && (
              <motion.div
                className="rounded-[var(--radius-md)] bg-[var(--color-destructive-bg)] p-3 text-center text-sm font-semibold text-[var(--color-destructive)]"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
              >
                {claimError}
              </motion.div>
            )}
            </AnimatePresence>

            {categories.map((category) => {
              const items = achievements.filter((achievement) => achievement.category === category);
              return (
                <CategorySection
                  key={category}
                  category={category}
                  achievements={items}
                  onClaim={handleClaim}
                  claimingId={claimingId}
                />
              );
            })}
          </LoadReveal>
        )}
      </div>
    </ProtectedWrapper>
  );
}
