import type { Workout } from "@/types";
import { Clock, Dumbbell, Zap } from "lucide-react";

interface PostWorkoutSummaryProps {
  workout: Workout;
}

export default function PostWorkoutSummary({ workout }: PostWorkoutSummaryProps) {
  const totalVolume = workout.workout_exercises.reduce(
    (sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + set.reps * set.weight, 0),
    0,
  );
  const volume = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toFixed(0);

  let duration: string | null = null;
  if (workout.finished_at && workout.created_at) {
    const minutes = Math.round(
      (new Date(workout.finished_at).getTime() - new Date(workout.created_at).getTime()) / 60000,
    );
    if (minutes >= 1) duration = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  return (
    <div className="relative mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--primary-200)]/60 bg-[var(--surface-raised)] p-4">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--primary-500)] to-[var(--lime-green)]" />
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-[0_8px_20px_rgba(116,87,245,0.2)]">
          <Dumbbell className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-600)]">Workout</p>
          <p className="truncate text-sm font-bold text-[var(--foreground)]">{workout.name}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
        <span className="badge badge-soft">{workout.workout_exercises.length} exercises</span>
        <span className="badge badge-soft"><Zap className="size-3.5" />{volume} kg</span>
        {duration && <span className="badge badge-soft"><Clock className="size-3.5" />{duration}</span>}
      </div>
    </div>
  );
}
