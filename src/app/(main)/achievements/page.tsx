"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Skeleton from "react-loading-skeleton";
import XPLevelCard from "@/components/XPLevelCard";
import type { Achievement, GamificationStats } from "@/types";
import {
  ArrowLeft,
  Trophy,
  Dumbbell,
  Activity,
  TrendingUp,
  Star,
  Award,
  Zap,
  Flame,
  Rocket,
  Target,
  Medal,
  BarChart2,
  Crown,
  Check,
  type LucideIcon,
} from "lucide-react";
import { ChartBarIncreasing } from "lucide-react";

// ── Icon registry ─────────────────────────────────────────────────────────────
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

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Trophy;
  return <Icon className={className} aria-hidden="true" />;
}

// ── Category meta ─────────────────────────────────────────────────────────────
type CategoryKey = Achievement["category"];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; colorVar: string; trackVar: string; headerBg: string }
> = {
  workouts: { label: "Workouts", colorVar: "var(--primary-600)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
  streaks:  { label: "Streaks",  colorVar: "var(--primary-500)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
  records:  { label: "Records",  colorVar: "var(--primary-700)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
  volume:   { label: "Volume",   colorVar: "var(--primary-400)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
};

// ── Circular progress ring ─────────────────────────────────────────────────────
function CategoryRing({ unlocked, total, colorVar, trackVar }: {
  unlocked: number; total: number; colorVar: string; trackVar: string;
}) {
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (total > 0 ? unlocked / total : 0));

  return (
    <svg width={size} height={size} className="rotate-[-90deg]" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackVar} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={colorVar} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
    </svg>
  );
}

// ── Badge card (three states: locked / claimable / claimed) ───────────────────
function AchievementBadge({
  achievement, colorVar, onClaim, claiming,
}: {
  achievement: Achievement;
  colorVar: string;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const isUnlocked  = !!achievement.unlockedAt;
  const isClaimed   = !!achievement.claimedAt;
  const isClaimable = isUnlocked && !isClaimed;

  return (
    <div
      title={achievement.description}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
        isClaimed ? "opacity-100" : isClaimable ? "opacity-100" : "opacity-35 grayscale"
      }`}
      style={
        isClaimed
          ? { borderColor: colorVar, backgroundColor: "var(--primary-50)", boxShadow: `0 0 0 1px ${colorVar}33` }
          : isClaimable
          ? { borderColor: colorVar, backgroundColor: "var(--surface)", boxShadow: `0 0 0 2px ${colorVar}55` }
          : { borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }
      }
    >
      {/* Spinner overlay — shown while this specific card is being claimed */}
      {claiming && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
          style={{ backgroundColor: "var(--surface)", opacity: 0.85 }}
        >
          <div
            className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
            style={{ borderColor: colorVar, borderTopColor: "transparent" }}
          />
        </div>
      )}

      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          isClaimed || isClaimable ? "bg-[var(--primary-50)]" : "bg-[var(--surface)]"
        }`}
        style={isClaimed || isClaimable ? { color: colorVar } : { color: "var(--muted-foreground)" }}
      >
        {isClaimed
          ? <Check className="w-4 h-4" />
          : <AchievementIcon name={achievement.icon} className="w-4 h-4" />}
      </div>

      {/* Name */}
      <span className="text-[11px] font-bold text-center leading-tight text-[var(--foreground)]">
        {achievement.name}
      </span>

      {/* XP pill / Claim button */}
      {isClaimed ? (
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ color: colorVar, backgroundColor: "var(--primary-100)" }}
        >
          +{achievement.xpReward} XP
        </span>
      ) : isClaimable ? (
        <button
          onClick={() => onClaim(achievement.id)}
          disabled={claiming}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors"
          style={{
            color: "var(--surface)",
            backgroundColor: colorVar,
            opacity: claiming ? 0.6 : 1,
            cursor: claiming ? "wait" : "pointer",
          }}
        >
          {`Claim +${achievement.xpReward} XP`}
        </button>
      ) : (
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ color: "var(--muted-foreground)", backgroundColor: "var(--surface)" }}
        >
          {achievement.xpReward} XP
        </span>
      )}
    </div>
  );
}

// ── Category section ───────────────────────────────────────────────────────────
function CategorySection({ category, achievements, onClaim, claimingId }: {
  category: CategoryKey;
  achievements: Achievement[];
  onClaim: (id: string) => void;
  claimingId: string | null;
}) {
  const meta = CATEGORY_META[category];
  const claimed = achievements.filter((a) => !!a.claimedAt).length;

  return (
    <section className="rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]">
      <div className="px-4 py-3 flex items-center gap-4" style={{ backgroundColor: meta.headerBg }}>
        <div className="relative flex-shrink-0">
          <CategoryRing unlocked={claimed} total={achievements.length} colorVar={meta.colorVar} trackVar={meta.trackVar} />
          <span
            className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums"
            style={{ color: meta.colorVar }}
          >
            {claimed}/{achievements.length}
          </span>
        </div>
        <div>
          <h2 className="text-base font-extrabold tracking-tight" style={{ color: meta.colorVar }}>
            {meta.label}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {claimed === achievements.length ? "All claimed!" : `${achievements.length - claimed} remaining`}
          </p>
        </div>
      </div>

      <div className="p-4 bg-[var(--surface)] grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {achievements.map((a) => (
          <AchievementBadge
            key={a.id}
            achievement={a}
            colorVar={meta.colorVar}
            onClaim={onClaim}
            claiming={claimingId === a.id}
          />
        ))}
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [claimingId, setClaimingId]     = useState<string | null>(null);
  const [claimError, setClaimError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => setGamification(d.gamification))
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = useCallback(async (achievementId: string) => {
    setClaimingId(achievementId);
    setClaimError(null);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Claim failed");
      }

      const result = await res.json() as {
        achievementId: string;
        claimedAt: string;
        xpEarned: number;
        totalXP: number;
        level: number;
        xpForCurrentLevel: number;
        xpForNextLevel: number;
        xpProgress: number;
      };

      // Update local state in-place — no full-page reload needed
      setGamification((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalXP:           result.totalXP,
          level:             result.level,
          xpForCurrentLevel: result.xpForCurrentLevel,
          xpForNextLevel:    result.xpForNextLevel,
          xpProgress:        result.xpProgress,
          achievements: prev.achievements.map((a) =>
            a.id === result.achievementId ? { ...a, claimedAt: result.claimedAt } : a,
          ),
        };
      });
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaimingId(null);
    }
  }, []);

  const categories: CategoryKey[] = ["workouts", "streaks", "records", "volume"];
  const totalClaimed     = gamification?.achievements.filter((a) => !!a.claimedAt).length ?? 0;
  const totalAchievements = gamification?.achievements.length ?? 0;
  const claimableCount   = gamification?.achievements.filter((a) => !!a.unlockedAt && !a.claimedAt).length ?? 0;

  return (
    <ProtectedWrapper>
      <div className="w-full space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] shadow-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[var(--primary-500)]" />
              Achievements
            </h1>
            {!loading && gamification && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {totalClaimed} / {totalAchievements} claimed
                {claimableCount > 0 && (
                  <span className="ml-2 text-[var(--primary-600)] font-semibold">
                    · {claimableCount} ready to claim
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-4 py-4">
            <Skeleton height={80} className="mb-4" />
            <Skeleton height={60} className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={80} className="rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-xl p-5 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {claimError && (
          <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-xl p-3 text-sm font-medium text-center">
            {claimError}
          </div>
        )}

        {!loading && gamification && (
          <>
            <XPLevelCard gamification={gamification} />
            {categories.map((cat) => {
              const items = gamification.achievements.filter((a) => a.category === cat);
              return (
                <CategorySection
                  key={cat}
                  category={cat}
                  achievements={items}
                  onClaim={handleClaim}
                  claimingId={claimingId}
                />
              );
            })}
          </>
        )}
      </div>
    </ProtectedWrapper>
  );
}
