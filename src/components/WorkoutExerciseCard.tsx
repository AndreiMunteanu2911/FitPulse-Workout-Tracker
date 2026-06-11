import RestTimer from "@/components/RestTimer";
import SetRow from "@/components/SetRow";
import { useState } from "react";
import type { WorkoutExercise, RestTimerState } from "@/types";
import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
        <div className="card shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary-50)]/75 to-transparent p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    {workoutExercise.exercise.gif_url && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-raised)]">
                            <ExerciseThumbnail src={workoutExercise.exercise.gif_url} />
                        </div>
                    )}
                    {!workoutExercise.exercise.gif_url && (
                        <div className="icon-tile !size-16">
                            <Dumbbell className="size-6" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary-600)]">Exercise {exerciseIndex + 1}</p>
                        <h3 className="truncate text-lg font-bold text-[var(--foreground)]">
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
            </div>

            <div className="p-5 sm:p-6">
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
                <motion.div layout className="space-y-2 mb-4">
                    <AnimatePresence initial={false} mode="popLayout">
                    {workoutExercise.sets.map((set, setIndex) => {
                        const isConfirmed = confirmedSetIds.has(set.id);
                        const showTimerHere = showTimer && restTimer?.setId === set.id;
                        const previous = workoutExercise.previousSets?.[setIndex] ?? null;
                        const previousLoading = !workoutExercise.previousSetsLoaded && set.set_number <= (workoutExercise.previousSets?.length ?? 0) + 1;
                        return (
                            <motion.div
                                key={set.client_key ?? set.id}
                                layout
                                initial={{ opacity: 0, height: 0, y: -8 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, x: 18 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="overflow-hidden"
                            >
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
                                    <motion.div className="mt-2" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                                        <RestTimer
                                            timer={restTimer!}
                                            onTick={onRestTimerTick!}
                                            onSkip={onRestTimerSkip!}
                                            onDismiss={onRestTimerDismiss!}
                                        />
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </motion.div>

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
