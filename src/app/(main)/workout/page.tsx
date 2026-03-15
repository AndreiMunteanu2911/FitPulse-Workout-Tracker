'use client'

import React, { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard from "@/components/WorkoutExerciseCard";
import ExerciseSearchModal from "@/components/ExerciseSearchModal";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import CancelWorkoutModal from "@/components/CancelWorkoutModal";
import FinishWorkoutModal from "@/components/FinishWorkoutModal";
import DiscardSetsModal from "@/components/DiscardSetsModal";
import { useWorkout } from "@/hooks/useWorkout";
import { useExercises } from "@/hooks/useExercises";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import TemplateCard from "@/components/TemplateCard";
import CreateTemplateModal from "@/components/CreateTemplateModal";
import DeleteTemplateModal from "@/components/DeleteTemplateModal";
import type { Exercise, WorkoutExercise, Set as WorkoutSet, WorkoutTemplate, RestTimerState } from "@/types";
import { detectExerciseType, REST_DURATIONS } from "@/lib/gamification";
import { Zap, Plus } from "lucide-react";
function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutPage() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutName, setWorkoutName] = useState("My Workout");
    const [workoutId, setWorkoutId] = useState<string | null>(null);
    const [workoutCreatedAt, setWorkoutCreatedAt] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});
    const [confirmedSetIds, setConfirmedSetIds] = useState<Set<string>>(new Set());

    // ── Rest Timer ──────────────────────────────────────────────────────────
    const [restTimer, setRestTimer] = useState<RestTimerState>({
        active: false,
        duration: 0,
        remaining: 0,
        exerciseName: "",
        exerciseType: "isolation",
    });

    const [showExerciseSearch, setShowExerciseSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [noDraftFound, setNoDraftFound] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [showDiscardSetsModal, setShowDiscardSetsModal] = useState(false);
    const [discardInfo, setDiscardInfo] = useState({ incompleteSetCount: 0, emptyExerciseCount: 0 });
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<WorkoutTemplate | null>(null);
    const { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates();

    const loadTemplates = async () => {
        try {
            const data = await fetchTemplates();
            setTemplates(data);
        } catch (error) {
            console.error("Error loading templates:", error);
        }
    };

    useEffect(() => {
        loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        getDraftWorkout,
        startWorkout: startWorkoutApi,
        updateWorkout,
        deleteWorkout,
        addExerciseToWorkout: addExerciseApi,
        deleteWorkoutExercise,
        addSet: addSetApi,
        updateSet: updateSetApi,
        deleteSet: deleteSetApi,
    } = useWorkout();
    const { searchExercises } = useExercises();

    useEffect(() => {
        const checkForDraftWorkout = async () => {
            setIsLoading(true);
            setNoDraftFound(false);
            try {
                const data = await getDraftWorkout();

                if (data) {
                    setWorkoutId(data.id);
                    setWorkoutName(data.name);
                    setWorkoutCreatedAt(data.created_at ?? null);
                    const exercises = (data.workout_exercises || []).map((we: WorkoutExercise) => ({
                        id: we.id,
                        exercise_id: we.exercise_id,
                        exercise: we.exercise,
                        order_index: we.order_index,
                        sets: (we.sets || []).sort((a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number),
                    }));
                    setWorkoutExercises(exercises);
                    setWorkoutStarted(true);
                    setErrorMessages({});
                    // Auto-confirm sets that already have valid values from a previous session
                    const preConfirmed = new Set<string>();
                    for (const we of data.workout_exercises || []) {
                        for (const s of we.sets || []) {
                            if (s.reps > 0 || s.weight > 0) {
                                preConfirmed.add(s.id);
                            }
                        }
                    }
                    setConfirmedSetIds(preConfirmed);
                } else {
                    setNoDraftFound(true);
                }
            } catch (error) {
                console.error("Error checking for draft workout:", error);
                setErrorMessages((prev) => ({ ...prev, general: "Failed to check for draft workout." }));
                setNoDraftFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkForDraftWorkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fix: useCallback for saveWorkoutToDB to avoid missing dependency
    const saveWorkoutToDB = React.useCallback(async () => {
        if (!workoutId) return;

        try {
            await updateWorkout(workoutId, { name: workoutName });

            for (const exercise of workoutExercises) {
                for (const set of exercise.sets) {
                    // Skip saving sets that have no reps or weight entered
                    if (set.reps === 0 && set.weight === 0) continue;
                    
                    await updateSetApi(set.id, { reps: set.reps, weight: set.weight });
                }
            }
        } catch (error) {
            console.error("Error auto-saving workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to auto-save workout." }));
        }
    }, [workoutId, workoutName, workoutExercises, updateWorkout, updateSetApi]);

    useEffect(() => {
        if (!workoutStarted || !workoutId) return;

        const autoSave = setTimeout(async () => {
            await saveWorkoutToDB();
        }, 2000);

        return () => clearTimeout(autoSave);
    }, [workoutExercises, workoutStarted, workoutId, saveWorkoutToDB]);

    // Live timer: tick every second while workout is in progress
    useEffect(() => {
        if (!workoutStarted || !workoutCreatedAt) return;
        const start = new Date(workoutCreatedAt).getTime();
        const tick = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [workoutStarted, workoutCreatedAt]);

    useEffect(() => {
        const searchExercisesDebounced = async () => {
            if (searchQuery.trim() === "") {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const data = await searchExercises(searchQuery, 10);
                setSearchResults(data as Exercise[]);
            } catch (error) {
                console.error("Error searching exercises:", error);
                setErrorMessages((prev) => ({ ...prev, search: "Failed to search exercises." }));
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchExercisesDebounced, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, searchExercises]);

    const startWorkout = async () => {
        try {
            const data = await startWorkoutApi(workoutName);
            setWorkoutId(data.id);
            setWorkoutCreatedAt(data.created_at ?? null);
            setWorkoutStarted(true);
        } catch (error) {
            console.error("Error starting workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to start workout." }));
        }
    };

    const startWorkoutFromTemplate = async (template: WorkoutTemplate) => {
        try {
            const data = await startWorkoutApi(template.name || "My Workout");
            const newWorkoutId = data.id;
            setWorkoutId(newWorkoutId);
            setWorkoutName(template.name || "My Workout");
            setWorkoutCreatedAt(data.created_at ?? null);
            setWorkoutStarted(true);

            const templateExercises = (template.template_exercises || []).sort(
                (a, b) => a.order_index - b.order_index
            );

            const addedExercises: WorkoutExercise[] = [];

            for (let i = 0; i < templateExercises.length; i++) {
                const te = templateExercises[i];
                if (!te.exercise_id) continue;

                const result = await addExerciseApi(newWorkoutId, te.exercise_id, i);
                const workoutExerciseData = result.workoutExercise as { id: string; order_index: number };
                const firstSet = result.set as WorkoutSet;

                let prefillSets: { reps: number; weight: number }[] = [];
                try {
                    const lastRes = await fetch(`/api/exercises/${te.exercise_id}/last-session`);
                    if (lastRes.ok) {
                        const lastData = await lastRes.json();
                        prefillSets = lastData.sets ?? [];
                    }
                } catch {
                    // silently ignore – we'll just use blank sets
                }

                let sets: WorkoutSet[] = [];
                if (prefillSets.length > 0) {
                    await updateSetApi(firstSet.id, { reps: prefillSets[0].reps, weight: prefillSets[0].weight });
                    sets.push({ ...firstSet, reps: prefillSets[0].reps, weight: prefillSets[0].weight });
                    for (let j = 1; j < prefillSets.length; j++) {
                        const newSet = await addSetApi(workoutExerciseData.id, j + 1);
                        await updateSetApi(newSet.id, { reps: prefillSets[j].reps, weight: prefillSets[j].weight });
                        sets.push({ ...newSet, reps: prefillSets[j].reps, weight: prefillSets[j].weight });
                    }
                } else {
                    sets = [firstSet];
                }

                addedExercises.push({
                    id: workoutExerciseData.id,
                    exercise_id: te.exercise_id,
                    exercise: te.exercise as Exercise,
                    order_index: workoutExerciseData.order_index,
                    sets,
                });
            }

            setWorkoutExercises(addedExercises);
        } catch (error) {
            console.error("Error starting workout from template:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to start workout from template." }));
        }
    };

    const handleConfirmSet = (setId: string, exercise: WorkoutExercise["exercise"], workoutExerciseId: string) => {
        setConfirmedSetIds((prev) => new Set([...prev, setId]));

        // Auto-start rest timer inline in the exercise card
        const exerciseType = detectExerciseType(exercise);
        const duration = REST_DURATIONS[exerciseType];
        setRestTimer({
            active: true,
            duration,
            remaining: duration,
            exerciseName: exercise.name,
            exerciseType,
            workoutExerciseId,
        });
    };

    const finishWorkout = async () => {
        if (!workoutId) return;

        try {
            await saveWorkoutToDB();
            await updateWorkout(workoutId, { status: "completed" });

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutCreatedAt(null);
            setElapsedSeconds(0);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
            setConfirmedSetIds(new Set());
            setErrorMessages({});
        } catch (error) {
            console.error("Error finishing workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to finish workout." }));
        }
    };

    const isValidSet = (s: WorkoutSet) => confirmedSetIds.has(s.id) && (s.reps > 0 || s.weight > 0);

    const handleFinishClick = () => {
        // Count incomplete sets: unconfirmed OR both reps and weight are 0
        let incompleteSetCount = 0;
        let emptyExerciseCount = 0;

        for (const exercise of workoutExercises) {
            const validSets = exercise.sets.filter(isValidSet);
            const badSets = exercise.sets.filter((s) => !isValidSet(s));
            incompleteSetCount += badSets.length;
            if (validSets.length === 0) {
                emptyExerciseCount += 1;
            }
        }

        if (incompleteSetCount > 0) {
            setDiscardInfo({ incompleteSetCount, emptyExerciseCount });
            setShowDiscardSetsModal(true);
        } else {
            setIsFinishModalOpen(true);
        }
    };

    const discardAndFinish = async () => {
        if (!workoutId) return;
        setShowDiscardSetsModal(false);

        try {
            // Delete invalid sets (unconfirmed or both 0/0) and empty exercises
            const exercisesToDelete: string[] = [];
            for (const exercise of workoutExercises) {
                const validSets = exercise.sets.filter(isValidSet);
                const badSets = exercise.sets.filter((s) => !isValidSet(s));
                for (const s of badSets) {
                    await deleteSetApi(s.id);
                }
                if (validSets.length === 0) {
                    exercisesToDelete.push(exercise.id);
                }
            }
            for (const exId of exercisesToDelete) {
                await deleteWorkoutExercise(exId);
            }
        } catch (error) {
            console.error("Error discarding sets:", error);
        }

        await finishWorkout();
    };

    const handleCancelWorkout = () => {
        setShowCancelModal(true);
    };

    const confirmCancelWorkout = async () => {
        if (!workoutId) return;
        try {
            await deleteWorkout(workoutId);

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutCreatedAt(null);
            setElapsedSeconds(0);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
            setErrorMessages({});
            setNoDraftFound(true);
        } catch (error) {
            console.error("Error canceling workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to cancel workout." }));
        } finally {
            setShowCancelModal(false);
        }
    };

    const addExerciseToWorkout = async (exercise: Exercise) => {
        if (!workoutId) return;

        try {
            const result = await addExerciseApi(workoutId, exercise.exercise_id, workoutExercises.length);
            const workoutExerciseData = result.workoutExercise as { id: string; order_index: number };
            const firstSet = result.set as WorkoutSet;

            // Fetch last session sets for this exercise to pre-fill
            let prefillSets: { reps: number; weight: number }[] = [];
            try {
                const lastRes = await fetch(`/api/exercises/${exercise.exercise_id}/last-session`);
                if (lastRes.ok) {
                    const lastData = await lastRes.json();
                    prefillSets = lastData.sets ?? [];
                }
            } catch {
                // silently ignore – we'll just use blank sets
            }

            let sets: WorkoutSet[] = [];

            if (prefillSets.length > 0) {
                // Update the first (already-created) set with the first prefill values
                await updateSetApi(firstSet.id, { reps: prefillSets[0].reps, weight: prefillSets[0].weight });
                sets.push({ ...firstSet, reps: prefillSets[0].reps, weight: prefillSets[0].weight });

                // Create additional sets for the rest
                for (let i = 1; i < prefillSets.length; i++) {
                    const newSet = await addSetApi(workoutExerciseData.id, i + 1);
                    await updateSetApi(newSet.id, { reps: prefillSets[i].reps, weight: prefillSets[i].weight });
                    sets.push({ ...newSet, reps: prefillSets[i].reps, weight: prefillSets[i].weight });
                }
            } else {
                sets = [firstSet];
            }

            setWorkoutExercises([
                ...workoutExercises,
                {
                    id: workoutExerciseData.id,
                    exercise_id: exercise.exercise_id,
                    exercise: exercise,
                    order_index: workoutExerciseData.order_index,
                    sets,
                },
            ]);

            setShowExerciseSearch(false);
            setSearchQuery("");
            setSearchResults([]);
            setErrorMessages((prev) => ({ ...prev, search: "" }));
        } catch (error) {
            console.error("Error adding exercise:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to add exercise." }));
        }
    };

    const addSetToExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];
        if (workoutExercise.sets.length >= 10) {
            setErrorMessages((prev) => ({
                ...prev,
                [`exercise-${exerciseIndex}`]: "Maximum 10 sets per exercise.",
            }));
            return;
        }

        try {
            const setNumber = workoutExercise.sets.length + 1;
            const data = await addSetApi(workoutExercise.id, setNumber);

            const updatedExercises = [...workoutExercises];
            updatedExercises[exerciseIndex] = {
                ...updatedExercises[exerciseIndex],
                sets: [...updatedExercises[exerciseIndex].sets, data],
            };
            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error adding set:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to add set." }));
        }
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
        const errorKey = `exercise-${exerciseIndex}-set-${setIndex}-${field}`;
        if (value < 0) {
            setErrorMessages((prev) => ({
                ...prev,
                [errorKey]: `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative.`,
            }));
            return;
        }

        const updatedExercises = [...workoutExercises];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...updatedExercises[exerciseIndex].sets[setIndex],
            [field]: value,
        };
        setWorkoutExercises(updatedExercises);
        setErrorMessages((prev) => ({ ...prev, [errorKey]: "" }));
    };

    const deleteSet = async (exerciseIndex: number, setIndex: number) => {
        const set = workoutExercises[exerciseIndex].sets[setIndex];

        try {
            await deleteSetApi(set.id);

            const updatedExercises = [...workoutExercises];
            updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
            updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((s, idx) => ({
                ...s,
                set_number: idx + 1,
            }));

            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error deleting set:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete set." }));
        }
    };

    const deleteExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];

        try {
            await deleteWorkoutExercise(workoutExercise.id);

            const updatedExercises = [...workoutExercises];
            updatedExercises.splice(exerciseIndex, 1);
            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error deleting exercise:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete exercise." }));
        }
    };

    return (
        <ProtectedWrapper>
            <div className="w-full">

                {isLoading ? (
                    <div className="flex justify-center items-center h-[60vh]">
                        <LoadingSpinner size={8} />
                    </div>
                ) : (
                    <>
                        {errorMessages.general && (
                            <div className="mb-4 text-red-600">{errorMessages.general}</div>
                        )}
                        <div className="page-header mb-6 flex items-center justify-between gap-3">
                          <div>
                            <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Workout</h1>
                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                              {workoutStarted ? (
                                <span className="font-mono font-semibold text-[var(--primary-600)] dark:text-[var(--primary-500)]">
                                    {formatElapsed(elapsedSeconds)}
                                </span>
                              ) : "Ready when you are"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!workoutStarted ? (
                                <Button onClick={startWorkout} className="px-4 py-2 text-sm sm:text-base">Start Workout</Button>
                            ) : (
                                <>
                                     <Button onClick={handleCancelWorkout} variant="secondary" className="px-3 py-2 text-sm">Cancel</Button>
                                    <Button onClick={handleFinishClick} className="px-4 py-2 text-sm sm:text-base">Finish</Button>
                                </>
                            )}
                          </div>
                        </div>
                        <CancelWorkoutModal
                            isOpen={showCancelModal}
                            onClose={() => setShowCancelModal(false)}
                            onConfirm={confirmCancelWorkout}
                        />
                        <FinishWorkoutModal
                            isOpen={isFinishModalOpen}
                            onClose={() => setIsFinishModalOpen(false)}
                            onConfirm={() => {
                                setIsFinishModalOpen(false);
                                finishWorkout();
                            }}
                        />
                        <DiscardSetsModal
                            isOpen={showDiscardSetsModal}
                            onClose={() => setShowDiscardSetsModal(false)}
                            onConfirm={discardAndFinish}
                            incompleteSetCount={discardInfo.incompleteSetCount}
                            emptyExerciseCount={discardInfo.emptyExerciseCount}
                        />
                        {noDraftFound && !workoutStarted && (
                            <div className="text-center py-16 bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow)] mb-6">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                    <Zap className="w-10 h-10 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Ready to train?</h3>
                                <p className="text-sm text-[var(--muted-foreground)] mb-6">Start a new workout or use a template.</p>
                            </div>
                        )}
                        {workoutStarted && (
                            <div className="space-y-6 sm:space-y-8 mt-4">
                                <div className="pb-4 mb-2">
                                    <input
                                        type="text"
                                        value={workoutName}
                                        onChange={(e) => setWorkoutName(e.target.value)}
                                        className="w-full px-0 py-2 text-[var(--foreground)] text-xl sm:text-2xl font-extrabold border-none focus:outline-none bg-transparent placeholder-[var(--muted-foreground)] tracking-tight"
                                        placeholder="Workout Name"
                                    />
                                </div>

                                {workoutExercises.length === 0 ? (
                                    <div className="text-center py-12 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                                        </div>
                                        <p className="text-sm text-[var(--muted-foreground)]">No exercises yet. Tap &quot;Add Exercise&quot; to begin.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 sm:space-y-6">
                                        {workoutExercises.map((workoutExercise, exerciseIndex) => (
                                            <ExerciseCard
                                                key={workoutExercise.id}
                                                workoutExercise={workoutExercise}
                                                exerciseIndex={exerciseIndex}
                                                onAddSet={addSetToExercise}
                                                onUpdateSet={updateSet}
                                                onDeleteSet={deleteSet}
                                                onDeleteExercise={deleteExercise}
                                                onConfirmSet={handleConfirmSet}
                                                confirmedSetIds={confirmedSetIds}
                                                errorMessage={errorMessages[`exercise-${exerciseIndex}`] || ""}
                                                setErrorMessage={(message: string) =>
                                                    setErrorMessages((prev) => ({
                                                        ...prev,
                                                        [`exercise-${exerciseIndex}`]: message,
                                                    }))
                                                }
                                                restTimer={restTimer}
                                                onRestTimerTick={(remaining) =>
                                                    setRestTimer((prev) => ({ ...prev, remaining }))
                                                }
                                                onRestTimerSkip={() =>
                                                    setRestTimer((prev) => ({ ...prev, active: false, remaining: 0 }))
                                                }
                                                onRestTimerDismiss={() =>
                                                    setRestTimer((prev) => ({ ...prev, active: false }))
                                                }
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-center pt-2">
                                    <Button onClick={() => setShowExerciseSearch(true)} className="py-2.5 px-8 text-base">
                                        Add Exercise
                                    </Button>
                                </div>

                                <ExerciseSearchModal
                                    isOpen={showExerciseSearch}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchResults={searchResults}
                                    isSearching={isSearching}
                                    onClose={() => {
                                        setShowExerciseSearch(false);
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setErrorMessages((prev) => ({ ...prev, search: "" }));
                                    }}
                                    onSelectExercise={addExerciseToWorkout}
                                />
                            </div>
                        )}

                        {/* Templates Section – only shown when no workout is active */}
                        {!workoutStarted && <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">Templates</h2>
                                <Button onClick={() => { setEditingTemplate(null); setIsTemplateModalOpen(true); }} variant="secondary" className="px-3 py-1.5 text-xs sm:text-sm">+ Create</Button>
                            </div>
                            {templates.length === 0 ? (
                                <div className="text-center text-sm text-[var(--muted-foreground)] py-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
                                    No templates yet. Create one to quickly start workouts!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            onEdit={() => {
                                                setEditingTemplate(template);
                                                setIsTemplateModalOpen(true);
                                            }}
                                            onDelete={() => setTemplateToDelete(template)}
                                            onStart={() => startWorkoutFromTemplate(template)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>}

                        <CreateTemplateModal
                            isOpen={isTemplateModalOpen}
                            onClose={() => {
                                setIsTemplateModalOpen(false);
                                setEditingTemplate(null);
                            }}
                            template={editingTemplate}
                            onSubmit={async (name, desc, exercises) => {
                                if (editingTemplate) {
                                    await updateTemplate({
                                        id: editingTemplate.id,
                                        name,
                                        description: desc,
                                        exercises: exercises.map(id => ({ exercise_id: id })),
                                    });
                                } else {
                                    await createTemplate({ name, description: desc, exercises: exercises.map(id => ({ exercise_id: id })) });
                                }
                                setIsTemplateModalOpen(false);
                                setEditingTemplate(null);
                                await loadTemplates();
                            }}
                        />
                        <DeleteTemplateModal
                            isOpen={templateToDelete !== null}
                            onClose={() => setTemplateToDelete(null)}
                            templateName={templateToDelete?.name ?? ""}
                            onConfirm={async () => {
                                if (!templateToDelete) return;
                                try {
                                    await deleteTemplate(templateToDelete.id);
                                    await loadTemplates();
                                } catch (error) {
                                    console.error("Error deleting template:", error);
                                }
                            }}
                        />
                    </>
                )}
            </div>
        </ProtectedWrapper>
    );
}