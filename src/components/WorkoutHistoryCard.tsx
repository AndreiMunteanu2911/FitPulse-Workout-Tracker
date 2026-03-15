import type { Workout } from "@/types";
import { ChevronRight, Zap, Clock, Sparkles } from "lucide-react";

interface WorkoutHistoryCardProps {
    workout: Workout;
    prCount?: number;
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function WorkoutHistoryCard({ workout, prCount }: WorkoutHistoryCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const calculateTotalVolume = (w: Workout) => {
        let totalVolume = 0;
        w.workout_exercises.forEach((we) => {
            we.sets.forEach((set) => {
                totalVolume += set.reps * set.weight;
            });
        });
        if (totalVolume >= 1000) return (totalVolume / 1000).toFixed(1) + "k";
        return totalVolume.toFixed(0);
    };

    const getDuration = (w: Workout): string | null => {
        if (!w.finished_at || !w.created_at) return null;
        const diff = new Date(w.finished_at).getTime() - new Date(w.created_at).getTime();
        const minutes = Math.round(diff / 60000);
        if (minutes < 1) return null;
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const duration = getDuration(workout);

    // Best set per exercise (highest volume = weight × reps)
    const getBestSet = (sets: Workout["workout_exercises"][number]["sets"]) => {
        if (sets.length === 0) return null;
        return sets.reduce((best, s) => {
            const vol = s.reps * s.weight;
            const bestVol = best.reps * best.weight;
            return vol > bestVol ? s : best;
        }, sets[0]);
    };

    const maxExercisesToShow = 4;
    const exercises = workout.workout_exercises.slice(0, maxExercisesToShow);
    const extraCount = workout.workout_exercises.length - maxExercisesToShow;

    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className="flex min-h-[5rem]">
                {/* Left accent strip */}
                <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-[var(--primary-500)] to-[var(--primary-700)]" />

                <div className="flex-1 p-4 sm:p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] leading-snug">{workout.name}</h3>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--muted-foreground)]" />
                    </div>

                    {/* Date – plain subtitle, no duration here */}
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">{formatDate(workout.workout_date)}</p>

                    {/* Stats badges: volume · duration · PRs */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {/* Volume */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
                            <Zap className="w-3 h-3" />
                            {calculateTotalVolume(workout)} kg
                        </span>

                        {/* Duration badge */}
                        {duration && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
                                <Clock className="w-3 h-3" />
                                {duration}
                            </span>
                        )}

                        {/* PR count badge */}
                        {typeof prCount === "number" && prCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success)]">
                                <Sparkles className="w-3 h-3" />
                                {prCount} PR{prCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* Exercise list */}
                    {workout.workout_exercises.length > 0 && (
                        <div className="space-y-0.5 border-t border-[var(--border)] pt-2 mt-1">
                            {exercises.map((we) => {
                                const best = getBestSet(we.sets);
                                return (
                                    <div key={we.id} className="flex items-baseline gap-1.5 text-xs">
                                        <span className="font-semibold text-[var(--foreground)] tabular-nums w-5 text-right flex-shrink-0">
                                            {we.sets.length}×
                                        </span>
                                        <span className="text-[var(--muted-foreground)] truncate flex-1">{capitalize(we.exercise.name)}</span>
                                        {best && best.weight > 0 && (
                                            <span className="flex-shrink-0 text-[var(--primary-600)] dark:text-[var(--primary-500)] font-semibold">
                                                {best.weight} kg × {best.reps}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {extraCount > 0 && (
                                <p className="text-xs text-[var(--muted-foreground)] pl-6">+{extraCount} more exercise{extraCount !== 1 ? "s" : ""}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
