'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard from "@/components/WorkoutExerciseCard";
import ExerciseSearchModal from "@/components/ExerciseSearchModal";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import CancelWorkoutModal from "@/components/CancelWorkoutModal";
import FinishWorkoutModal from "@/components/FinishWorkoutModal";
import DiscardSetsModal from "@/components/DiscardSetsModal";
import AddCustomExerciseModal from "@/components/AddCustomExerciseModal";
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
    const router = useRouter();
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
    const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
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
                        previousSets: we.previousSets ?? [],
                        previousSetsLoaded: true,
                    }));
                    setWorkoutExercises(exercises);
                    setWorkoutStarted(true);
                    setErrorMessages({});
                    // Restore confirmed state from DB (is_confirmed column)
                    const preConfirmed = new Set<string>();
                    for (const we of data.workout_exercises || []) {
                        for (const s of we.sets || []) {
                            if (s.is_confirmed) {
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
            // Optimistic: show template exercises immediately
            const templateExercises = (template.template_exercises || []).sort(
                (a, b) => a.order_index - b.order_index
            );

            const optimisticExercises: WorkoutExercise[] = templateExercises
                .filter((te) => te.exercise_id)
                .map((te, i) => ({
                    id: crypto.randomUUID(),
                    exercise_id: te.exercise_id,
                    exercise: te.exercise as Exercise,
                    order_index: te.order_index,
                    sets: [{ id: crypto.randomUUID(), workout_exercise_id: "", set_number: 1, reps: 0, weight: 0, is_confirmed: false }],
                    previousSets: [],
                    previousSetsLoaded: false, // will load in parallel below
                }));

            // Show immediately
            const data = await startWorkoutApi(template.name || "My Workout");
            setWorkoutId(data.id);
            setWorkoutName(template.name || "My Workout");
            setWorkoutCreatedAt(data.created_at ?? null);
            setWorkoutStarted(true);
            setWorkoutExercises(optimisticExercises);

            // Persist each exercise in PARALLEL
            await Promise.all(optimisticExercises.map(async (optEx, i) => {
                const te = templateExercises[i];
                if (!te.exercise_id) return;

                try {
                    // Fire both requests in parallel
                    const [result, lastSession] = await Promise.all([
                        addExerciseApi(data.id, te.exercise_id, i),
                        fetch(`/api/exercises/${te.exercise_id}/last-session`).then(r => r.ok ? r.json() : { sets: [] }).catch(() => ({ sets: [] })),
                    ]);

                    const workoutExerciseData = result.workoutExercise as { id: string; order_index: number };
                    const firstSet = result.set as WorkoutSet;
                    const prefillSets: { reps: number; weight: number }[] = lastSession.sets ?? [];

                    let sets: WorkoutSet[] = [];
                    if (prefillSets.length > 0) {
                        sets.push({ ...firstSet, reps: prefillSets[0].reps, weight: prefillSets[0].weight, is_confirmed: false });
                        for (let j = 1; j < prefillSets.length; j++) {
                            sets.push({ id: crypto.randomUUID(), workout_exercise_id: workoutExerciseData.id, set_number: j + 1, reps: prefillSets[j].reps, weight: prefillSets[j].weight, is_confirmed: false });
                        }
                    } else {
                        sets = [firstSet];
                    }

                    setWorkoutExercises((prev) => {
                        const idx = prev.findIndex((e) => e.id === optEx.id);
                        if (idx === -1) return prev;
                        const updated = [...prev];
                        updated[idx] = {
                            id: workoutExerciseData.id,
                            exercise_id: te.exercise_id,
                            exercise: te.exercise as Exercise,
                            order_index: workoutExerciseData.order_index,
                            sets,
                            previousSets: prefillSets,
                            previousSetsLoaded: true,
                        };
                        return updated;
                    });

                    // Sync sets with server in parallel (fire-and-forget)
                    const syncPromises: Promise<unknown>[] = [];
                    if (prefillSets.length > 0) {
                        syncPromises.push(updateSetApi(firstSet.id, { reps: prefillSets[0].reps, weight: prefillSets[0].weight }));
                        for (let j = 1; j < prefillSets.length; j++) {
                            syncPromises.push(addSetApi(workoutExerciseData.id, j + 1));
                        }
                    }
                    Promise.all(syncPromises).catch(() => {});
                } catch {
                    console.error(`Failed to persist exercise ${te.exercise_id}`);
                }
            }));
        } catch (error) {
            console.error("Error starting workout from template:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to start workout from template." }));
        }
    };

    const handleConfirmSet = async (setId: string, exercise: WorkoutExercise["exercise"], workoutExerciseId: string) => {
        // Optimistic: confirm set and start timer immediately
        setConfirmedSetIds((prev) => new Set([...prev, setId]));

        const exerciseType = detectExerciseType(exercise);
        const duration = REST_DURATIONS[exerciseType];
        setRestTimer({
            active: true,
            duration,
            remaining: duration,
            exerciseName: exercise.name,
            exerciseType,
            workoutExerciseId,
            setId,
        });

        // Persist in background (fire-and-forget)
        try {
            await fetch(`/api/sets/${setId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_confirmed: true }),
            });
        } catch {
            // Silently fail — UI state already updated
        }
    };

    const finishWorkout = async () => {
        if (!workoutId) return;

        // Optimistic: clear UI and redirect immediately
        const finishingWorkoutId = workoutId;
        router.push(`/history/${finishingWorkoutId}`);
        setWorkoutStarted(false);
        setWorkoutId(null);
        setWorkoutCreatedAt(null);
        setElapsedSeconds(0);
        setWorkoutExercises([]);
        setWorkoutName("My Workout");
        setConfirmedSetIds(new Set());
        setErrorMessages({});

        // Persist in background
        try {
            await saveWorkoutToDB();
            await updateWorkout(finishingWorkoutId, { status: "completed" });
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

        // Optimistic: remove bad sets and exercises from UI immediately
        const finishingWorkoutId = workoutId;
        const exercisesToKeep: WorkoutExercise[] = [];
        for (const exercise of workoutExercises) {
            const validSets = exercise.sets.filter(isValidSet);
            if (validSets.length > 0) {
                exercisesToKeep.push({ ...exercise, sets: validSets.map((s, idx) => ({ ...s, set_number: idx + 1 })) });
            }
        }
        setWorkoutExercises(exercisesToKeep);

        // Finish the workout
        await finishWorkout();

        // Persist deletions in background (fire-and-forget)
        try {
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
    };

    const confirmAllAndFinish = async () => {
        setShowDiscardSetsModal(false);

        // Optimistic: confirm all sets locally and remove empty exercises
        const exercisesToKeep: WorkoutExercise[] = [];
        for (const exercise of workoutExercises) {
            const hasValidSet = exercise.sets.some(
                (s) => s.is_confirmed || s.reps > 0 || s.weight > 0,
            );
            if (hasValidSet) {
                exercisesToKeep.push(exercise);
            }
        }
        setWorkoutExercises(exercisesToKeep);
        // Mark all qualifying sets as confirmed
        setConfirmedSetIds((prev) => {
            const next = new Set(prev);
            for (const exercise of workoutExercises) {
                for (const s of exercise.sets) {
                    if (s.reps > 0 || s.weight > 0) next.add(s.id);
                }
            }
            return next;
        });

        // Persist confirmations and deletions in background (fire-and-forget)
        try {
            for (const exercise of workoutExercises) {
                for (const s of exercise.sets) {
                    if (!s.is_confirmed && (s.reps > 0 || s.weight > 0)) {
                        try {
                            await fetch(`/api/sets/${s.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ is_confirmed: true }),
                            });
                        } catch { /* ignore */ }
                    }
                }
            }
            for (const exercise of workoutExercises) {
                const hasValidSet = exercise.sets.some(
                    (s) => s.is_confirmed || s.reps > 0 || s.weight > 0,
                );
                if (!hasValidSet) {
                    await deleteWorkoutExercise(exercise.id);
                }
            }
        } catch (error) {
            console.error("Error confirming sets:", error);
        }

        await finishWorkout();
    };

    const handleCancelWorkout = () => {
        setShowCancelModal(true);
    };

    const confirmCancelWorkout = async () => {
        if (!workoutId) return;
        setShowCancelModal(false);

        // Optimistic: clear UI immediately
        const cancelingWorkoutId = workoutId;
        setWorkoutStarted(false);
        setWorkoutId(null);
        setWorkoutCreatedAt(null);
        setElapsedSeconds(0);
        setWorkoutExercises([]);
        setWorkoutName("My Workout");
        setErrorMessages({});
        setNoDraftFound(true);

        // Persist in background
        try {
            await deleteWorkout(cancelingWorkoutId);
        } catch (error) {
            console.error("Error canceling workout:", error);
        }
    };

    const addExerciseToWorkout = async (exercise: Exercise) => {
        if (!workoutId) return;

        // Optimistic: show exercise card immediately with a blank set
        const tempId = crypto.randomUUID();
        const tempSet: WorkoutSet = { id: crypto.randomUUID(), workout_exercise_id: tempId, set_number: 1, reps: 0, weight: 0, is_confirmed: false };
        const optimisticExercise: WorkoutExercise = {
            id: tempId,
            exercise_id: exercise.exercise_id,
            exercise: exercise,
            order_index: workoutExercises.length,
            sets: [tempSet],
            previousSets: [],
            previousSetsLoaded: false, // loading
        };
        setWorkoutExercises([...workoutExercises, optimisticExercise]);
        setShowExerciseSearch(false);
        setSearchQuery("");
        setSearchResults([]);
        setErrorMessages((prev) => ({ ...prev, search: "" }));

        // Fire both requests in PARALLEL — no waiting for one before starting the other
        const exercisePromise = addExerciseApi(workoutId, exercise.exercise_id, workoutExercises.length);
        const lastSessionPromise = fetch(`/api/exercises/${exercise.exercise_id}/last-session`).then(r => r.ok ? r.json() : { sets: [] }).catch(() => ({ sets: [] }));

        try {
            const [result, lastSession] = await Promise.all([exercisePromise, lastSessionPromise]);

            const workoutExerciseData = result.workoutExercise as { id: string; order_index: number };
            const firstSet = result.set as WorkoutSet;
            const prefillSets: { reps: number; weight: number }[] = lastSession.sets ?? [];

            // Build the sets locally from last session data
            let sets: WorkoutSet[] = [];
            if (prefillSets.length > 0) {
                sets.push({ ...firstSet, reps: prefillSets[0].reps, weight: prefillSets[0].weight, is_confirmed: false });
                for (let i = 1; i < prefillSets.length; i++) {
                    // Create additional sets — we'll sync them with server in background
                    sets.push({ id: crypto.randomUUID(), workout_exercise_id: workoutExerciseData.id, set_number: i + 1, reps: prefillSets[i].reps, weight: prefillSets[i].weight, is_confirmed: false });
                }
            } else {
                sets = [firstSet];
            }

            // Update the exercise with real data + pre-filled sets
            setWorkoutExercises((prev) => {
                const idx = prev.findIndex((e) => e.id === tempId);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                    id: workoutExerciseData.id,
                    exercise_id: exercise.exercise_id,
                    exercise: exercise,
                    order_index: workoutExerciseData.order_index,
                    sets,
                    previousSets: prefillSets,
                    previousSetsLoaded: true,
                };
                return updated;
            });

            // Sync all set changes with server in PARALLEL (fire-and-forget)
            const syncPromises: Promise<unknown>[] = [];
            if (prefillSets.length > 0) {
                syncPromises.push(updateSetApi(firstSet.id, { reps: prefillSets[0].reps, weight: prefillSets[0].weight }));
                for (let i = 1; i < prefillSets.length; i++) {
                    syncPromises.push(addSetApi(workoutExerciseData.id, i + 1));
                    // We'll update the returned IDs in a follow-up, but it's fine to keep temp IDs
                    // since they're only used for optimistic UI
                }
            }
            // Wait for sync to complete but don't block the UI
            Promise.all(syncPromises).catch(() => {});
        } catch (error) {
            console.error("Error adding exercise:", error);
            setWorkoutExercises((prev) => prev.filter((e) => e.id !== tempId));
            setErrorMessages((prev) => ({ ...prev, general: "Failed to add exercise." }));
        }
    };

    const createCustomExercise = async (name: string, bodyPart: string) => {
        // Optimistic: create a temp exercise and add to workout immediately
        const tempExerciseId = `custom_${crypto.randomUUID()}`;
        const tempId = crypto.randomUUID();
        const tempSet: WorkoutSet = { id: crypto.randomUUID(), workout_exercise_id: tempId, set_number: 1, reps: 0, weight: 0, is_confirmed: false };
        const optimisticExercise: WorkoutExercise = {
            id: tempId,
            exercise_id: tempExerciseId,
            exercise: { exercise_id: tempExerciseId, name, body_parts: bodyPart ? [bodyPart] : null, is_custom: true },
            order_index: workoutExercises.length,
            sets: [tempSet],
            previousSets: [],
            previousSetsLoaded: true, // custom exercises have no history
        };
        setWorkoutExercises([...workoutExercises, optimisticExercise]);
        setShowCustomExerciseModal(false);

        // Persist in background
        try {
            const res = await fetch("/api/custom-exercises", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, body_part: bodyPart || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create exercise");

            // Now add this exercise to the workout on the server
            await addExerciseToWorkout({
                exercise_id: data.exercise.exercise_id,
                name: data.exercise.name,
                body_parts: data.exercise.body_part ? [data.exercise.body_part] : null,
                is_custom: true,
            });

            // Remove the optimistic placeholder (addExerciseToWorkout will create the real one)
            setWorkoutExercises((prev) => prev.filter((e) => e.id !== tempId));
        } catch (error) {
            console.error("Error creating custom exercise:", error);
            // Rollback
            setWorkoutExercises((prev) => prev.filter((e) => e.id !== tempId));
            throw error;
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

        // Optimistic: add set to UI immediately
        const setNumber = workoutExercise.sets.length + 1;
        const tempSet: WorkoutSet = { id: crypto.randomUUID(), workout_exercise_id: workoutExercise.id, set_number: setNumber, reps: 0, weight: 0, is_confirmed: false };
        const updatedExercises = [...workoutExercises];
        updatedExercises[exerciseIndex] = { ...workoutExercise, sets: [...workoutExercise.sets, tempSet] };
        setWorkoutExercises(updatedExercises);

        // Persist in background
        try {
            const data = await addSetApi(workoutExercise.id, setNumber);
            // Replace temp ID with real ID
            setWorkoutExercises((prev) => {
                const next = [...prev];
                const ex = { ...next[exerciseIndex] };
                ex.sets = ex.sets.map((s) => s.id === tempSet.id ? { ...s, id: data.id } : s);
                next[exerciseIndex] = ex;
                return next;
            });
        } catch (error) {
            console.error("Error adding set:", error);
            // Rollback: remove the temp set
            setWorkoutExercises((prev) => {
                const next = [...prev];
                const ex = { ...next[exerciseIndex] };
                ex.sets = ex.sets.filter((s) => s.id !== tempSet.id).map((s, idx) => ({ ...s, set_number: idx + 1 }));
                next[exerciseIndex] = ex;
                return next;
            });
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
        const setToRemove = workoutExercises[exerciseIndex].sets[setIndex];
        const prevExercises = [...workoutExercises];

        // Optimistic: remove from UI immediately
        const updatedExercises = [...workoutExercises];
        updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
        updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((s, idx) => ({
            ...s,
            set_number: idx + 1,
        }));
        setWorkoutExercises(updatedExercises);

        // Persist in background
        try {
            await deleteSetApi(setToRemove.id);
        } catch (error) {
            console.error("Error deleting set:", error);
            // Rollback: restore the deleted set
            setWorkoutExercises(prevExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete set." }));
        }
    };

    const deleteExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];
        const prevExercises = [...workoutExercises];

        // Optimistic: remove from UI immediately
        const updatedExercises = [...workoutExercises];
        updatedExercises.splice(exerciseIndex, 1);
        setWorkoutExercises(updatedExercises);

        // Persist in background
        try {
            await deleteWorkoutExercise(workoutExercise.id);
        } catch (error) {
            console.error("Error deleting exercise:", error);
            // Rollback: restore the deleted exercise
            setWorkoutExercises(prevExercises);
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
                            <div className="mb-4 text-[var(--color-destructive)]">{errorMessages.general}</div>
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
                            onConfirmAll={confirmAllAndFinish}
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
                                    onAddCustomExercise={() => {
                                        setShowExerciseSearch(false);
                                        setShowCustomExerciseModal(true);
                                    }}
                                />
                                
                                <AddCustomExerciseModal
                                    isOpen={showCustomExerciseModal}
                                    onClose={() => setShowCustomExerciseModal(false)}
                                    onSubmit={createCustomExercise}
                                    initialName={searchQuery}
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
                                    // Optimistic: update in local list immediately
                                    const prev = [...templates];
                                    setTemplates((tpls) => tpls.map((tpl) => tpl.id === editingTemplate.id ? { ...tpl, name, description: desc } : tpl));
                                    setIsTemplateModalOpen(false);
                                    setEditingTemplate(null);
                                    try {
                                        await updateTemplate({ id: editingTemplate.id, name, description: desc, exercises: exercises.map(id => ({ exercise_id: id })) });
                                    } catch (error) {
                                        console.error("Error updating template:", error);
                                        setTemplates(prev); // rollback
                                    }
                                } else {
                                    // Optimistic: add to local list immediately
                                    const tempId = crypto.randomUUID();
                                    const newTemplate = { id: tempId, name, description: desc, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as WorkoutTemplate;
                                    setTemplates((t) => [newTemplate, ...t]);
                                    setIsTemplateModalOpen(false);
                                    setEditingTemplate(null);
                                    try {
                                        const created = await createTemplate({ name, description: desc, exercises: exercises.map(id => ({ exercise_id: id })) });
                                        setTemplates((t) => t.map((tpl) => tpl.id === tempId ? created : tpl));
                                    } catch (error) {
                                        console.error("Error creating template:", error);
                                        setTemplates((t) => t.filter((tpl) => tpl.id !== tempId)); // rollback
                                    }
                                }
                            }}
                        />
                        <DeleteTemplateModal
                            isOpen={templateToDelete !== null}
                            onClose={() => setTemplateToDelete(null)}
                            templateName={templateToDelete?.name ?? ""}
                            onConfirm={async () => {
                                if (!templateToDelete) return;
                                const targetId = templateToDelete.id;
                                // Optimistic: remove from local list immediately
                                setTemplates((t) => t.filter((tpl) => tpl.id !== targetId));
                                setTemplateToDelete(null);
                                try {
                                    await deleteTemplate(targetId);
                                } catch (error) {
                                    console.error("Error deleting template:", error);
                                    // rollback handled by refetch on next load
                                }
                            }}
                        />
                    </>
                )}
            </div>
        </ProtectedWrapper>
    );
}