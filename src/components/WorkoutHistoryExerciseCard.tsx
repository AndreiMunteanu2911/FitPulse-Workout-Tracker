import LoadingSpinner from "@/components/LoadingSpinner";
import { useState } from "react";

interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface Set {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise: Exercise;
    order_index: number;
    sets: Set[];
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
        <div className="relative w-full h-full bg-transparent">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
                    <LoadingSpinner size={3} variant="image" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export default function WorkoutHistoryExerciseCard({ workoutExercise }: WorkoutHistoryExerciseCardProps) {
    return (
        <div className="bg-[var(--surface)] rounded-lg p-4 mb-4 border-2 border-[var(--primary-600)] dark:border-[var(--primary-500)] shadow-sm">
            {/* Header with exercise name and image */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border)]">
                {workoutExercise.exercise.gif_url && (
                    <div className="flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden bg-transparent">
                        <ImageWithSpinner src={workoutExercise.exercise.gif_url} alt={workoutExercise.exercise.name} />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">
                        {capitalize(workoutExercise.exercise.name)}
                    </h3>
                    {workoutExercise.exercise.target_muscles?.[0] && (
                        <p className="text-xs text-[var(--muted-foreground)] capitalize">
                            {workoutExercise.exercise.target_muscles[0]}
                        </p>
                    )}
                </div>
            </div>

            {/* Target muscles tags */}
            <div className="flex gap-2 flex-wrap mb-4">
                {workoutExercise.exercise.target_muscles?.length
                    ? workoutExercise.exercise.target_muscles.map((muscle, idx) => (
                        <span key={idx} className="inline-block rounded-full bg-[var(--primary-500)] dark:bg-[var(--primary-600)] text-white px-3 py-1 text-xs font-medium">
                            {capitalize(muscle)}
                        </span>
                    ))
                    : <span className="inline-block rounded-full bg-[var(--primary-500)] dark:bg-[var(--primary-600)] text-white px-3 py-1 text-xs font-medium">—</span>
                }
            </div>

            {/* Sets */}
            <div className="space-y-2">
                {workoutExercise.sets.map((set) => (
                    <div
                        key={set.id}
                        className="grid grid-cols-2 gap-y-1 gap-x-4 md:flex md:items-center mt-4 md:mt-2 md:ml-2 md:gap-12"
                    >
                        <span className="text-[var(--foreground)] text-sm font-medium">Set {set.set_number}</span>
                        <span className="text-[var(--primary-600)] dark:text-[var(--primary-400)] text-sm font-semibold">
                            {set.reps} reps
                        </span>
                        <span className="text-[var(--primary-600)] dark:text-[var(--primary-400)] text-sm font-semibold">
                            {set.weight} kg
                        </span>
                        <span className="text-[var(--muted-foreground)] text-xs md:ml-auto">
                            Volume: {(set.reps * set.weight).toFixed(1)} kg
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
