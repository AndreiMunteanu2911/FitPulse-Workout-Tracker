import React from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import RestTimer from "@/components/RestTimer";
import SetRow from "@/components/SetRow";
import { useState } from "react";
import type { WorkoutExercise, RestTimerState } from "@/types";
import { Trash2, Plus } from "lucide-react";

interface ExerciseCardProps {
    workoutExercise: WorkoutExercise;
    exerciseIndex: number;
    onAddSet: (exerciseIndex: number) => void;
    onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
    onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
    onDeleteExercise: (exerciseIndex: number) => void;
    onConfirmSet: (setId: string, exercise: WorkoutExercise["exercise"], workoutExerciseId: string) => void;
    confirmedSetIds: Set<string>;
    errorMessage: string;
    setErrorMessage: (message: string) => void;
    restTimer?: RestTimerState;
    onRestTimerTick?: (remaining: number) => void;
    onRestTimerSkip?: () => void;
    onRestTimerDismiss?: () => void;
}

function capitalizeFirstLetter(str: string) {
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

export default function WorkoutExerciseCard({
    workoutExercise,
    exerciseIndex,
    onAddSet,
    onUpdateSet,
    onDeleteSet,
    onDeleteExercise,
    onConfirmSet,
    confirmedSetIds,
    errorMessage,
    setErrorMessage,
    restTimer,
    onRestTimerTick,
    onRestTimerSkip,
    onRestTimerDismiss,
}: ExerciseCardProps) {
    const showTimer =
        restTimer?.active &&
        restTimer.workoutExerciseId === workoutExercise.id &&
        onRestTimerTick &&
        onRestTimerSkip &&
        onRestTimerDismiss;

    const previousSets = workoutExercise.previousSets ?? [];

    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] overflow-hidden">
            {/* Accent top strip */}
            <div className="h-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)]" />

            <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    {workoutExercise.exercise.gif_url && (
                        <div className="flex-shrink-0 w-14 h-14 rounded-[var(--radius-md)] overflow-hidden bg-[var(--surface-raised)]">
                            <ImageWithSpinner src={workoutExercise.exercise.gif_url} alt={workoutExercise.exercise.name} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate">
                            {capitalizeFirstLetter(workoutExercise.exercise.name)}
                        </h3>
                        {workoutExercise.exercise.target_muscles?.[0] && (
                            <p className="text-xs text-[var(--muted-foreground)] capitalize mt-0.5">
                                {workoutExercise.exercise.target_muscles[0]}
                            </p>
                        )}
                    </div>
                    <button
                        aria-label="Delete exercise"
                        onClick={() => onDeleteExercise(exerciseIndex)}
                        className="flex-shrink-0 w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)] hover:text-[var(--primary-600)] dark:hover:text-[var(--primary-700)] transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-md)] text-sm font-medium">
                        {errorMessage}
                    </div>
                )}

                {/* Column headers */}
                <div className="grid grid-cols-[2.5rem_3.5rem_1fr_1fr_5rem] gap-2 px-1 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Set</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-center">Prev</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-center">Reps</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-center">kg</span>
                    <span />
                </div>

                {/* Sets */}
                <div className="space-y-1.5 mb-4">
                    {workoutExercise.sets.map((set, setIndex) => {
                        const isConfirmed = confirmedSetIds.has(set.id);
                        const showTimerHere = showTimer && restTimer?.setId === set.id;
                        const previous = previousSets[setIndex] ?? null;
                        return (
                            <React.Fragment key={set.id}>
                                <SetRow
                                    set={set}
                                    setIndex={setIndex}
                                    exerciseIndex={exerciseIndex}
                                    isConfirmed={isConfirmed}
                                    previous={previous}
                                    onUpdateSet={onUpdateSet}
                                    onDeleteSet={onDeleteSet}
                                    onConfirmSet={onConfirmSet}
                                    exercise={workoutExercise.exercise}
                                    workoutExerciseId={workoutExercise.id}
                                />
                                {/* Inline rest timer — renders directly under the confirmed set row */}
                                {showTimerHere && (
                                    <RestTimer
                                        timer={restTimer!}
                                        onTick={onRestTimerTick!}
                                        onSkip={onRestTimerSkip!}
                                        onDismiss={onRestTimerDismiss!}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Add Set */}
                <button
                    onClick={() => onAddSet(exerciseIndex)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] rounded-[var(--radius-lg)] hover:brightness-95 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Set
                </button>
            </div>
        </div>
    );
}
