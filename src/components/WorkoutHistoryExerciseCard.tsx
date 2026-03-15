import LoadingSpinner from "@/components/LoadingSpinner";
import { useState } from "react";
import type { WorkoutExercise } from "@/types";

/** Epley formula: weight × (1 + reps/30). Returns null for invalid inputs (zero/negative weight or reps). */
function calcEpley1RM(weight: number, reps: number): number | null {
    if (weight <= 0 || reps <= 0) return null;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
}

interface WorkoutHistoryExerciseCardProps {
    workoutExercise: WorkoutExercise;
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function ImageWithSpinner({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    
    return (
        <div className="relative w-full h-full">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <LoadingSpinner size={3} variant="image" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export default function WorkoutHistoryExerciseCard({ workoutExercise }: WorkoutHistoryExerciseCardProps) {
    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pb-3">
                {workoutExercise.exercise.gif_url && (
                    <div className="flex-shrink-0 w-14 h-14 rounded-[var(--radius-md)] overflow-hidden bg-[var(--surface-raised)]">
                        <ImageWithSpinner src={workoutExercise.exercise.gif_url} alt={workoutExercise.exercise.name} />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate">
                        {capitalize(workoutExercise.exercise.name)}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {workoutExercise.exercise.target_muscles?.slice(0, 2).map((muscle, idx) => (
                            <span key={idx} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)] capitalize">
                                {capitalize(muscle)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sets table */}
            <div className="px-4 pb-4">
                <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] overflow-hidden overflow-x-auto">
                    {/* Column headers */}
                    <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-[var(--border)] min-w-[300px]">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Set</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-right">Reps</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-right">Weight</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-right">Vol.</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-right">1RM</span>
                    </div>
                    {workoutExercise.sets.map((set, idx) => {
                        const orm = calcEpley1RM(set.weight, set.reps);
                        return (
                            <div
                                key={set.id}
                                className={`grid grid-cols-5 gap-2 px-4 py-2.5 min-w-[300px] ${idx < workoutExercise.sets.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                            >
                                <span className="text-sm font-semibold text-[var(--foreground)]">{set.set_number}</span>
                                <span className="text-sm font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)] text-right">{set.reps}</span>
                                <span className="text-sm font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)] text-right">{set.weight} kg</span>
                                <span className="text-xs text-[var(--muted-foreground)] text-right self-center">{(set.reps * set.weight).toFixed(0)}</span>
                                <span className="text-xs text-[var(--muted-foreground)] text-right self-center tabular-nums">
                                    {orm !== null ? `${Math.round(orm)} kg` : "—"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
