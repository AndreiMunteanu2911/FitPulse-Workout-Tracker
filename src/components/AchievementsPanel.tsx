"use client";

import type { Achievement } from "@/types";

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

  return (
    <div
      title={achievement.description}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-lg)] border transition-all ${
        unlocked
          ? "bg-[var(--surface-raised)] border-[var(--primary-500)] shadow-[0_0_0_1px_var(--primary-500)]"
          : "bg-[var(--surface-raised)] border-[var(--border)] opacity-40 grayscale"
      }`}
    >
      <span
        className={`text-2xl leading-none ${unlocked ? "" : "filter grayscale"}`}
        role="img"
        aria-label={achievement.name}
      >
        {achievement.icon}
      </span>
      <span
        className={`text-[10px] font-semibold text-center leading-tight ${
          unlocked ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
        }`}
      >
        {achievement.name}
      </span>
      {unlocked && (
        <span className="text-[9px] font-bold text-[var(--primary-500)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] rounded px-1.5 py-0.5">
          +{achievement.xpReward} XP
        </span>
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
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
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
