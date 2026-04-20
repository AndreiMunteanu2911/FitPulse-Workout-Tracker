"use client";

import type { Achievement } from "@/types";
import {
  Trophy, Dumbbell, Activity, TrendingUp, Award,
  Zap, Flame, Rocket, Target, Medal, BarChart2, Crown,
  type LucideIcon,
} from "lucide-react";
import { ChartBarIncreasing } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Activity, TrendingUp, Award,
  Zap, Flame, Rocket, Trophy, Target, Medal,
  BarChart2, ChartBarIncreasing, Crown,
};

interface AchievementsPanelProps {
  achievements: Achievement[];
}

const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  workouts: "Workouts",
  streaks: "Streaks",
  records: "Records",
  volume: "Volume",
};

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const unlocked = !!achievement.unlockedAt;
  const Icon = ICON_MAP[achievement.icon] ?? Trophy;

  return (
    <div
      title={achievement.description}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-sm)] border transition-all ${
        unlocked
          ? "bg-[var(--surface-raised)]"
          : "bg-[var(--surface-raised)] border-[var(--border)] opacity-40 grayscale"
      }`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          unlocked ? "text-[var(--primary-500)] bg-[var(--primary-50)]" : "text-[var(--muted-foreground)]"
        }`}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" />
      </span>
      <span
        className={`text-[10px] font-semibold text-center leading-tight ${
          unlocked ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
        }`}
      >
        {achievement.name}
      </span>
      {unlocked && (
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[9px] font-bold text-[var(--primary-500)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] rounded px-1.5 py-0.5">
            +{achievement.xpReward} XP
          </span>
        </div>
      )}
    </div>
  );
}

export default function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const categories = (
    Object.keys(CATEGORY_LABELS) as Achievement["category"][]
  );

  const unlockedCount = achievements.filter((a) => !!a.unlockedAt).length;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          Achievements
        </h3>
        <span className="text-xs text-[var(--muted-foreground)]">
          {unlockedCount} / {achievements.length} unlocked
        </span>
      </div>

      {categories.map((cat) => {
        const items = achievements.filter((a) => a.category === cat);
        return (
          <div key={cat} className="mb-4 last:mb-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {items.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
