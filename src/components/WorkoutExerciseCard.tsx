import Button from "./Button";
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

interface ExerciseCardProps {
    workoutExercise: WorkoutExercise;
    exerciseIndex: number;
    onAddSet: (exerciseIndex: number) => void;
    onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
    onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
    onDeleteExercise: (exerciseIndex: number) => void;
    errorMessage: string;
    setErrorMessage: (message: string) => void;
}

function capitalizeFirstLetter(str: string) {
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

export default function WorkoutExerciseCard({
    workoutExercise,
    exerciseIndex,
    onAddSet,
    onUpdateSet,
    onDeleteSet,
    onDeleteExercise,
    errorMessage,
    setErrorMessage,
}: ExerciseCardProps) {
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
                        {capitalizeFirstLetter(workoutExercise.exercise.name)}
                    </h3>
                    {workoutExercise.exercise.target_muscles?.[0] && (
                        <p className="text-xs text-[var(--muted-foreground)] capitalize">
                            {workoutExercise.exercise.target_muscles[0]}
                        </p>
                    )}
                </div>
                <Button
                    variant="textOnly"
                    aria-label="Delete exercise"
                    onClick={() => onDeleteExercise(exerciseIndex)}
                    className="flex-shrink-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </Button>
            </div>

            {errorMessage && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            {/* Sets list */}
            <div className="space-y-2 mb-4">
                {workoutExercise.sets.map((set, setIndex) => (
                    <div
                        key={set.id}
                        className="flex items-center gap-3 p-3 rounded-sm border-b border-[var(--border)] last:border-b-0"
                    >
                        <span className="text-sm font-semibold text-[var(--foreground)] min-w-[50px]">
                            Set {set.set_number}
                        </span>

                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Reps"
                                    value={set.reps || ""}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        onUpdateSet(exerciseIndex, setIndex, "reps", value);
                                        setErrorMessage("");
                                    }}
                                    min="0"
                                    className="w-16 px-2 py-1.5 text-center border-b-2 border-[var(--border)] bg-transparent text-[var(--foreground)] focus:border-[var(--primary-500)] focus:outline-none rounded-none text-sm font-medium placeholder-[var(--muted-foreground)]"
                                />
                                <span className="text-xs text-[var(--muted-foreground)]">reps</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Weight"
                                    value={set.weight || ""}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        onUpdateSet(exerciseIndex, setIndex, "weight", value);
                                        setErrorMessage("");
                                    }}
                                    min="0"
                                    step="1"
                                    className="w-20 px-2 py-1.5 text-center border-b-2 border-[var(--border)] bg-transparent text-[var(--foreground)] focus:border-[var(--primary-500)] focus:outline-none rounded-none text-sm font-medium placeholder-[var(--muted-foreground)]"
                                />
                                <span className="text-xs text-[var(--muted-foreground)]">kg</span>
                            </div>

                            <Button
                                variant="textOnly"
                                aria-label="Delete set"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onDeleteSet(exerciseIndex, setIndex);
                                }}
                                className="ml-auto text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Set Button */}
            <button
                onClick={() => onAddSet(exerciseIndex)}
                className="w-full py-2.5 mt-2 border-2 border-dashed border-[var(--primary-400)] dark:border-[var(--primary-600)] text-[var(--primary-600)] dark:text-[var(--primary-400)] font-semibold hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-900)]/20 transition-colors flex items-center justify-center gap-2 rounded-sm"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Set
            </button>
        </div>
    );
}
