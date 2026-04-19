import type { Workout } from "@/types";
import { Zap, Clock, Calendar } from "lucide-react";

interface PostWorkoutSummaryProps {
  workout: Workout;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function PostWorkoutSummary({ workout }: PostWorkoutSummaryProps) {
  const totalVolume = workout.workout_exercises.reduce((sum, we) =>
    sum + we.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0
  );
  const volumeLabel = totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + "k" : totalVolume.toFixed(0);

  const getDuration = (): string | null => {
    if (!workout.finished_at || !workout.created_at) return null;
    const diff = new Date(workout.finished_at).getTime() - new Date(workout.created_at).getTime();
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const duration = getDuration();
  const maxToShow = 3;
  const exercises = workout.workout_exercises.slice(0, maxToShow);
  const extraCount = workout.workout_exercises.length - maxToShow;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getBestSet = (sets: Workout["workout_exercises"][number]["sets"]) => {
    if (sets.length === 0) return null;
    return sets.reduce((best, s) => s.reps * s.weight > best.reps * best.weight ? s : best, sets[0]);
  };

  return (
    <div className="mt-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-raised)] overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary-500)]/10 to-[var(--primary-400)]/5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-[var(--primary-600)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">{workout.name}</span>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">{formatDate(workout.workout_date)}</p>
      </div>

      <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-[var(--border)]">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)]">
          <Zap className="w-3 h-3" />
          {volumeLabel} kg
        </span>
        {duration && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)]">
            <Clock className="w-3 h-3" />
            {duration}
          </span>
        )}
      </div>

      {workout.workout_exercises.length > 0 && (
        <div className="px-4 py-2.5 space-y-1">
          {exercises.map((we) => {
            const best = getBestSet(we.sets);
            return (
              <div key={we.id} className="flex items-baseline gap-1.5 text-xs">
                <span className="font-semibold text-[var(--foreground)] tabular-nums w-5 text-right flex-shrink-0">
                  {we.sets.length}×
                </span>
                <span className="text-[var(--muted-foreground)] truncate flex-1">
                  {capitalize(we.exercise.name)}
                </span>
                {best && best.weight > 0 && (
                  <span className="flex-shrink-0 text-[var(--primary-600)] dark:text-[var(--primary-500)] font-semibold">
                    {best.weight} kg × {best.reps}
                  </span>
                )}
              </div>
            );
          })}
          {extraCount > 0 && (
            <p className="text-xs text-[var(--muted-foreground)] pl-6">
              +{extraCount} more exercise{extraCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
