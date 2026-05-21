import type { Workout } from "@/types";
import { ChevronRight, Zap, Clock, Sparkles, Calendar } from "lucide-react";

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
        <div className="group cursor-pointer overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <div className="flex min-h-[5rem]">
                {/* Left date circle */}
                <div className="flex-shrink-0 w-14 h-14 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white mt-4 ml-4 shadow-[0_12px_26px_rgba(116,87,245,0.22)]">
                    <Calendar className="w-5 h-5" />
                </div>

                <div className="flex-1 p-4 sm:p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-base sm:text-xl font-extrabold text-[var(--foreground)] leading-snug group-hover:text-[var(--primary-600)]" style={{ fontFamily: "var(--font-poppins)" }}>{workout.name}</h3>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--muted-foreground)]" />
                    </div>

                    {/* Date – plain subtitle */}
                    <p className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">{formatDate(workout.workout_date)}</p>

                    {/* Stats badges: volume · duration · PRs */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {/* Volume */}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-50)] px-3 py-1.5 text-xs font-bold text-[var(--primary-700)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                            <Zap className="w-3 h-3" />
                            {calculateTotalVolume(workout)} kg
                        </span>

                        {/* Duration badge */}
                        {duration && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-50)] px-3 py-1.5 text-xs font-bold text-[var(--primary-700)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                                <Clock className="w-3 h-3" />
                                {duration}
                            </span>
                        )}

                        {/* PR count badge */}
                        {typeof prCount === "number" && prCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-success)]">
                                <Sparkles className="w-3 h-3" />
                                {prCount} PR{prCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* Exercise list */}
                    {workout.workout_exercises.length > 0 && (
                        <div className="mt-3 space-y-1.5 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3">
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
