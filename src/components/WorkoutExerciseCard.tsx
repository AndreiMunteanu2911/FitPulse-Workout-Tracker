import React from "react";
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

function ExerciseThumbnail({ src }: { src: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full h-full bg-[var(--surface-raised)] overflow-hidden">
            {!loaded && <div className="absolute inset-0 bg-[var(--surface-raised)]" />}
            <img
                src={src}
                alt=""
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

    return (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            <div className="p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    {workoutExercise.exercise.gif_url && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-raised)]">
                            <ExerciseThumbnail src={workoutExercise.exercise.gif_url} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)] truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                            {capitalizeFirstLetter(workoutExercise.exercise.name)}
                        </h3>
                        {workoutExercise.exercise.target_muscles?.[0] && (
                            <p className="mt-1 inline-flex rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-bold capitalize text-[var(--muted-foreground)]">
                                {workoutExercise.exercise.target_muscles[0]}
                            </p>
                        )}
                    </div>
                    <button
                        aria-label="Delete exercise"
                        onClick={() => onDeleteExercise(exerciseIndex)}
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)] transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mb-3 rounded-[var(--radius-lg)] bg-[var(--color-destructive-bg)] p-4 text-sm font-bold text-[var(--color-destructive)]">
                        {errorMessage}
                    </div>
                )}

                {/* Column headers */}
                <div className="mb-2 grid grid-cols-[2.5rem_3.5rem_1fr_1fr_5rem] gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] px-3 py-2">
                    <span className="text-[10px] ml-1.5 font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Set</span>
                    <span className="text-[10px] ml-6.5 font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-center">Prev</span>
                    <span className="text-[10px] ml-3 font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-center">Reps</span>
                    <span className="text-[10px] mr-3 font-semibold uppercase tracking-widest text-[var(--muted-foreground)] text-center">kg</span>
                    <span />
                </div>

                {/* Sets */}
                <div className="space-y-2 mb-4">
                    {workoutExercise.sets.map((set, setIndex) => {
                        const isConfirmed = confirmedSetIds.has(set.id);
                        const showTimerHere = showTimer && restTimer?.setId === set.id;
                        const previous = workoutExercise.previousSets?.[setIndex] ?? null;
                        const previousLoading = !workoutExercise.previousSetsLoaded && set.set_number <= (workoutExercise.previousSets?.length ?? 0) + 1;
                        return (
                            <React.Fragment key={set.id}>
                                <SetRow
                                    set={set}
                                    setIndex={setIndex}
                                    exerciseIndex={exerciseIndex}
                                    isConfirmed={isConfirmed}
                                    previous={previous}
                                    previousLoading={previousLoading}
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
                    className="w-full min-h-12 rounded-full bg-[var(--primary-50)] py-3 flex items-center justify-center gap-2 text-sm font-extrabold text-[var(--primary-600)] transition-all hover:-translate-y-0.5 hover:brightness-95 dark:bg-[var(--primary-100)] dark:text-[var(--primary-500)]"
                >
                    <Plus className="w-4 h-4" />
                    Add Set
                </button>
            </div>
        </div>
    );
}
