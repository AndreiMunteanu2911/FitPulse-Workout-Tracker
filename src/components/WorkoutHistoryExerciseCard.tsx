import { useState } from "react";
import type { WorkoutExercise } from "@/types";

interface WorkoutHistoryExerciseCardProps {
    workoutExercise: WorkoutExercise;
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function ExerciseThumbnail({ src }: { src: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-raised)]">
            {!loaded && <div className="absolute inset-0 bg-[var(--surface-raised)]" />}
            <img
                src={src}
                alt=""
                className={`h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export default function WorkoutHistoryExerciseCard({ workoutExercise }: WorkoutHistoryExerciseCardProps) {
    return (
        <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
                {workoutExercise.exercise.gif_url && <ExerciseThumbnail src={workoutExercise.exercise.gif_url} />}
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-[var(--foreground)]">
                        {capitalize(workoutExercise.exercise.name)}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {workoutExercise.sets.length} {workoutExercise.sets.length === 1 ? "set" : "sets"}
                        {workoutExercise.exercise.target_muscles?.[0] ? ` / ${capitalize(workoutExercise.exercise.target_muscles[0])}` : ""}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {workoutExercise.sets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Set {set.set_number}</span>
                        <span className="text-sm font-semibold text-[var(--foreground)]">{set.weight} kg x {set.reps}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
