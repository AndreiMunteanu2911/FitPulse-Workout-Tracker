import type { Workout } from "@/types";
import { ArrowRight, Clock, Pencil, Share2, Sparkles, Trash2, Zap } from "lucide-react";
import Button from "@/components/Button";

interface WorkoutHistoryCardProps {
    workout: Workout;
    prCount?: number;
    onOpen: () => void;
    onShare: () => void;
    onRename: () => void;
    onDelete: () => void;
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function WorkoutHistoryCard({
    workout,
    prCount,
    onOpen,
    onShare,
    onRename,
    onDelete,
}: WorkoutHistoryCardProps) {
    const date = new Date(workout.workout_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const totalVolume = workout.workout_exercises.reduce(
        (total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
        0,
    );
    const volumeLabel = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toFixed(0);

    let duration: string | null = null;
    if (workout.finished_at && workout.created_at) {
        const minutes = Math.round(
            (new Date(workout.finished_at).getTime() - new Date(workout.created_at).getTime()) / 60000,
        );
        if (minutes >= 1) {
            duration = minutes < 60
                ? `${minutes} min`
                : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
        }
    }

    const exerciseNames = workout.workout_exercises
        .slice(0, 4)
        .map((exercise) => capitalize(exercise.exercise.name));
    const extraExercises = workout.workout_exercises.length - exerciseNames.length;

    return (
        <article className="card group">
            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="eyebrow !mb-1">{date}</p>
                        <h3 className="text-lg font-bold tracking-[-0.025em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary-600)] sm:text-xl">
                            {workout.name}
                        </h3>
                    </div>
                    <Button
                        onClick={onOpen}
                        variant="textOnly"
                        className="min-h-9 shrink-0 px-3 py-2 text-xs sm:min-h-9 sm:px-3 sm:py-2 sm:text-xs"
                    >
                        View details
                        <ArrowRight className="size-3.5" />
                    </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="badge badge-soft"><Zap className="size-3.5" />{volumeLabel} kg</span>
                    <span className="badge badge-soft">{workout.workout_exercises.length} exercises</span>
                    {duration && <span className="badge badge-soft"><Clock className="size-3.5" />{duration}</span>}
                    {!!prCount && prCount > 0 && (
                        <span className="badge bg-[var(--color-success-bg)] text-[var(--color-success)]">
                            <Sparkles className="size-3.5" />{prCount} PR{prCount === 1 ? "" : "s"}
                        </span>
                    )}
                </div>

                {exerciseNames.length > 0 && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {exerciseNames.join(" / ")}
                        {extraExercises > 0 ? ` / +${extraExercises} more` : ""}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-5 py-3 sm:px-6">
                <button onClick={onShare} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary-600)]">
                    <Share2 className="size-3.5" />Share
                </button>
                <button onClick={onRename} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                    <Pencil className="size-3.5" />Rename
                </button>
                <button onClick={onDelete} className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)]">
                    <Trash2 className="size-3.5" />Delete
                </button>
            </div>
        </article>
    );
}
