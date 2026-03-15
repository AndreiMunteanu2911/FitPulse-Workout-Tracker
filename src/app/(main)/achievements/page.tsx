"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import XPLevelCard from "@/components/XPLevelCard";
import type { Achievement, GamificationStats } from "@/types";
import { ArrowLeft, Trophy } from "lucide-react";

// ── Tier colour palette (inspired by achievement tier systems) ─────────────────
type CategoryKey = Achievement["category"];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; color: string; trackColor: string; bgFrom: string; bgTo: string; badgeBorder: string; badgeBg: string }
> = {
  workouts: {
    label: "Workouts",
    color: "#6366f1",        // indigo
    trackColor: "#e0e7ff",
    bgFrom: "#eef2ff",
    bgTo: "#c7d2fe",
    badgeBorder: "#6366f1",
    badgeBg: "#eef2ff",
  },
  streaks: {
    label: "Streaks",
    color: "#f59e0b",        // amber
    trackColor: "#fef3c7",
    bgFrom: "#fffbeb",
    bgTo: "#fde68a",
    badgeBorder: "#f59e0b",
    badgeBg: "#fffbeb",
  },
  records: {
    label: "Records",
    color: "#a855f7",        // purple
    trackColor: "#f3e8ff",
    bgFrom: "#faf5ff",
    bgTo: "#e9d5ff",
    badgeBorder: "#a855f7",
    badgeBg: "#faf5ff",
  },
  volume: {
    label: "Volume",
    color: "#10b981",        // emerald
    trackColor: "#d1fae5",
    bgFrom: "#ecfdf5",
    bgTo: "#a7f3d0",
    badgeBorder: "#10b981",
    badgeBg: "#ecfdf5",
  },
};

// ── Inline circular progress ring ─────────────────────────────────────────────
function CategoryRing({
  unlocked,
  total,
  color,
  trackColor,
}: {
  unlocked: number;
  total: number;
  color: string;
  trackColor: string;
}) {
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? unlocked / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
    </svg>
  );
}

// ── Badge card ─────────────────────────────────────────────────────────────────
function AchievementBadge({
  achievement,
  accentColor,
  accentBg,
}: {
  achievement: Achievement;
  accentColor: string;
  accentBg: string;
}) {
  const unlocked = !!achievement.unlockedAt;

  return (
    <div
      title={achievement.description}
      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all select-none ${
        unlocked ? "opacity-100" : "opacity-40 grayscale"
      }`}
      style={
        unlocked
          ? {
              borderColor: accentColor,
              backgroundColor: accentBg,
              boxShadow: `0 0 0 1px ${accentColor}33`,
            }
          : { borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }
      }
    >
      <span className="text-3xl leading-none" role="img" aria-label={achievement.name}>
        {achievement.icon}
      </span>
      <span className="text-[11px] font-bold text-center leading-tight text-[var(--foreground)]">
        {achievement.name}
      </span>
      <span
        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
        style={
          unlocked
            ? { color: accentColor, backgroundColor: `${accentColor}22` }
            : { color: "var(--muted-foreground)", backgroundColor: "var(--surface)" }
        }
      >
        {unlocked ? `+${achievement.xpReward} XP` : `${achievement.xpReward} XP`}
      </span>
    </div>
  );
}

// ── Category section ───────────────────────────────────────────────────────────
function CategorySection({
  category,
  achievements,
}: {
  category: CategoryKey;
  achievements: Achievement[];
}) {
  const meta = CATEGORY_META[category];
  const unlocked = achievements.filter((a) => !!a.unlockedAt).length;

  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]"
    >
      {/* Header with gradient strip + ring */}
      <div
        className="px-4 py-3 flex items-center gap-4"
        style={{
          background: `linear-gradient(135deg, ${meta.bgFrom} 0%, ${meta.bgTo} 100%)`,
        }}
      >
        <div className="relative flex-shrink-0">
          <CategoryRing
            unlocked={unlocked}
            total={achievements.length}
            color={meta.color}
            trackColor={meta.trackColor}
          />
          {/* Centre text (rotated back upright) */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums"
            style={{ color: meta.color }}
          >
            {unlocked}/{achievements.length}
          </span>
        </div>

        <div>
          <h2
            className="text-base font-extrabold tracking-tight"
            style={{ color: meta.color }}
          >
            {meta.label}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {unlocked === achievements.length
              ? "All unlocked! 🎉"
              : `${achievements.length - unlocked} remaining`}
          </p>
        </div>
      </div>

      {/* Badge grid */}
      <div className="p-4 bg-[var(--surface)] grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {achievements.map((a) => (
          <AchievementBadge
            key={a.id}
            achievement={a}
            accentColor={meta.color}
            accentBg={meta.badgeBg}
          />
        ))}
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => setGamification(d.gamification))
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const categories: CategoryKey[] = ["workouts", "streaks", "records", "volume"];

  const totalUnlocked = gamification?.achievements.filter((a) => !!a.unlockedAt).length ?? 0;
  const totalAchievements = gamification?.achievements.length ?? 0;

  return (
    <ProtectedWrapper>
      <div className="w-full space-y-5">
        {/* Page header */}
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
              <Trophy className="w-6 h-6 text-amber-500" />
              Achievements
            </h1>
            {!loading && gamification && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {totalUnlocked} / {totalAchievements} unlocked
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size={12} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-xl p-5 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && gamification && (
          <>
            {/* XP / Level card */}
            <XPLevelCard gamification={gamification} />

            {/* Category sections */}
            {categories.map((cat) => {
              const items = gamification.achievements.filter((a) => a.category === cat);
              return (
                <CategorySection key={cat} category={cat} achievements={items} />
              );
            })}
          </>
        )}
      </div>
    </ProtectedWrapper>
  );
}
