"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import { PageHeader } from "@/components/PageHeader";
import type { Achievement } from "@/types";
import {
  Activity,
  Award,
  BarChart2,
  Check,
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

type CategoryKey = Achievement["category"];

const CATEGORY_META: Record<CategoryKey, { label: string; icon: LucideIcon }> = {
  workouts: { label: "Workouts", icon: Dumbbell },
  streaks: { label: "Streaks", icon: Flame },
  records: { label: "Records", icon: Trophy },
  volume: { label: "Volume", icon: BarChart2 },
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
      className={`relative rounded-[var(--radius-md)] border p-3 transition-all duration-200 ${
        isClaimed
          ? "border-[var(--border)] bg-[var(--surface)]"
          : isClaimable
            ? "border-[var(--lime-green)] bg-[var(--surface)] shadow-[0_8px_22px_rgba(226,241,99,0.12)]"
            : "border-[var(--border)] bg-[var(--surface)] opacity-60"
      }`}
    >
      <AnimatePresence initial={false}>
      {claiming && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface)]/85"
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
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
            isClaimable
              ? "bg-[var(--lime-green)] text-[#232323]"
              : isClaimed
                ? "bg-[var(--primary-50)] text-[var(--primary-600)]"
                : "bg-[var(--surface-raised)] text-[var(--muted-foreground)]"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isClaimed ? (
              <motion.span key="claimed" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.16 }}>
                <Check className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="icon" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.14 }}>
                <AchievementIcon name={achievement.icon} className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-snug text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
              {achievement.name}
            </h3>
            <span className="flex-shrink-0 rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted-foreground)]">
              {achievement.xpReward} XP
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {achievement.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isClaimed ? "text-[var(--color-success)]" : isClaimable ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
          }`}
        >
          {isClaimed && <CheckCircle2 className="h-3.5 w-3.5" />}
          {isClaimed ? "Claimed" : isClaimable ? "Ready to claim" : "Locked"}
        </span>

        <AnimatePresence initial={false}>
        {isClaimable && (
          <motion.button
            onClick={() => onClaim(achievement.id)}
            disabled={claiming}
            className="rounded-full bg-[var(--lime-green)] px-3 py-1.5 text-xs font-bold text-[#232323] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.14 }}
          >
            Claim
          </motion.button>
        )}
        </AnimatePresence>
      </div>
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
      className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 sm:p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-50)] text-[var(--primary-600)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
              {meta.label}
            </h2>
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">
              {claimed}/{achievements.length}
            </span>
          </div>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            <section className="card p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
                    Overall progress
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)] transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[18rem]">
                  <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-3">
                    <p className="text-xl font-extrabold text-[var(--foreground)]">{progress}%</p>
                    <p className="mt-1 text-[11px] font-semibold text-[var(--muted-foreground)]">Complete</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-3">
                    <p className="text-xl font-extrabold text-[var(--foreground)]">{totalClaimed}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[var(--muted-foreground)]">Claimed</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-3">
                    <p className="text-xl font-extrabold text-[var(--foreground)]">{claimableCount}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[var(--muted-foreground)]">Ready</p>
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
