"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Skeleton from "react-loading-skeleton";
import type { Achievement } from "@/types";
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

type CategoryKey = Achievement["category"];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; colorVar: string; trackVar: string; headerBg: string }
> = {
  workouts: { label: "Workouts", colorVar: "var(--primary-600)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
  streaks: { label: "Streaks", colorVar: "var(--primary-500)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
  records: { label: "Records", colorVar: "var(--primary-700)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
  volume: { label: "Volume", colorVar: "var(--primary-400)", trackVar: "var(--primary-100)", headerBg: "var(--primary-50)" },
};

function CategoryRing({
  unlocked,
  total,
  colorVar,
  trackVar,
}: {
  unlocked: number;
  total: number;
  colorVar: string;
  trackVar: string;
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
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorVar}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
    </svg>
  );
}

function AchievementBadge({
  achievement,
  colorVar,
  onClaim,
  claiming,
}: {
  achievement: Achievement;
  colorVar: string;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const isUnlocked = !!achievement.unlockedAt;
  const isClaimed = !!achievement.claimedAt;
  const isClaimable = isUnlocked && !isClaimed;

  return (
    <div
      title={achievement.description}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
        isClaimed ? "opacity-100" : isClaimable ? "opacity-100" : "opacity-35 grayscale"
      }`}
      style={
        isClaimed
          ? { backgroundColor: "var(--primary-50)" }
          : isClaimable
            ? { backgroundColor: "var(--surface)" }
            : { backgroundColor: "var(--surface-raised)" }
      }
    >
      {claiming && (
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center z-10"
          style={{ backgroundColor: "var(--surface)", opacity: 0.85 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: colorVar, borderTopColor: "transparent" }} />
        </div>
      )}

      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          isClaimed || isClaimable ? "bg-[var(--primary-50)]" : "bg-[var(--surface)]"
        }`}
        style={isClaimed || isClaimable ? { color: colorVar } : { color: "var(--muted-foreground)" }}
      >
        {isClaimed ? <Check className="w-4 h-4" /> : <AchievementIcon name={achievement.icon} className="w-4 h-4" />}
      </div>

      <span className="text-[11px] font-bold text-center leading-tight text-[var(--foreground)]">
        {achievement.name}
      </span>

      {isClaimed ? (
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: colorVar, backgroundColor: "var(--primary-100)" }}>
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
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: "var(--muted-foreground)", backgroundColor: "var(--surface)" }}>
          {achievement.xpReward} XP
        </span>
      )}
    </div>
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
  const claimed = achievements.filter((a) => !!a.claimedAt).length;

  return (
    <section className="rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-4" style={{ backgroundColor: meta.headerBg }}>
        <div className="relative flex-shrink-0">
          <CategoryRing unlocked={claimed} total={achievements.length} colorVar={meta.colorVar} trackVar={meta.trackVar} />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums" style={{ color: meta.colorVar }}>
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
          <AchievementBadge key={a.id} achievement={a} colorVar={meta.colorVar} onClaim={onClaim} claiming={claimingId === a.id} />
        ))}
      </div>
    </section>
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
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => setAchievements(d.achievements || []))
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

      const result = (await res.json()) as {
        achievementId: string;
        claimedAt: string;
      };

      setAchievements((prev) => prev.map((a) => (a.id === result.achievementId ? { ...a, claimedAt: result.claimedAt } : a)));
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaimingId(null);
    }
  }, []);

  const categories: CategoryKey[] = ["workouts", "streaks", "records", "volume"];
  const totalClaimed = achievements.filter((a) => !!a.claimedAt).length;
  const totalAchievements = achievements.length;
  const claimableCount = achievements.filter((a) => !!a.unlockedAt && !a.claimedAt).length;

  return (
    <ProtectedWrapper>
      <div className="w-full space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[var(--primary-500)]" />
              Achievements
            </h1>
            {!loading && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {totalClaimed} / {totalAchievements} claimed
                {claimableCount > 0 && <span className="ml-2 text-[var(--primary-600)] font-semibold">· {claimableCount} ready to claim</span>}
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
                <Skeleton key={i} height={80} className="rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-lg p-5 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {claimError && (
          <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-lg p-3 text-sm font-medium text-center">
            {claimError}
          </div>
        )}

        {!loading && (
          <>
            {categories.map((cat) => {
              const items = achievements.filter((a) => a.category === cat);
              return <CategorySection key={cat} category={cat} achievements={items} onClaim={handleClaim} claimingId={claimingId} />;
            })}
          </>
        )}
      </div>
    </ProtectedWrapper>
  );
}
