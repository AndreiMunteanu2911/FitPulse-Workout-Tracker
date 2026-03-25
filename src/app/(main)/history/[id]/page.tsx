"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import WorkoutHistoryExerciseCard from "@/components/WorkoutHistoryExerciseCard";
import WorkoutExerciseCard from "@/components/WorkoutExerciseCard";
import ExerciseSearchModal from "@/components/ExerciseSearchModal";
import AddCustomExerciseModal from "@/components/AddCustomExerciseModal";
import { useHistory } from "@/hooks/useHistory";
import { useWorkout } from "@/hooks/useWorkout";
import { useExercises } from "@/hooks/useExercises";
import type { Workout, WorkoutExercise, Exercise, Set as WorkoutSet } from "@/types";
import { ChevronLeft, Pencil, PenSquare, Trash2 } from "lucide-react";

export default function WorkoutDetailPage() {
    const params = useParams();
    const router = useRouter();
    const workoutId = params?.id as string;

    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Rename / delete modal state
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [confirmedSetIds, setConfirmedSetIds] = useState<Set<string>>(new Set());
    const [editErrorMessages, setEditErrorMessages] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    // Exercise search state
    const [showExerciseSearch, setShowExerciseSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);

    const { fetchWorkoutDetail, renameWorkout, deleteWorkout } = useHistory();
    const {
        addExerciseToWorkout: addExerciseApi,
        deleteWorkoutExercise,
        addSet: addSetApi,
        updateSet: updateSetApi,
        deleteSet: deleteSetApi,
    } = useWorkout();
    const { searchExercises } = useExercises();

    const fetchWorkoutDetails = useCallback(async () => {
        try {
            const data = await fetchWorkoutDetail(workoutId);
            setWorkout(data);
            setError(null);
        } catch {
            setError("Failed to fetch workout details.");
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workoutId]);

    useEffect(() => {
        if (!workoutId) return;
        fetchWorkoutDetails();
    }, [workoutId, fetchWorkoutDetails]);

    useEffect(() => {
        if (showRenameModal) setTimeout(() => renameInputRef.current?.focus(), 50);
    }, [showRenameModal]);

    // --- Rename / delete ---
    const handleRename = async () => {
        if (!workout || !renameValue.trim()) return;
        setRenaming(true);
        try {
            await renameWorkout(workout.id, renameValue.trim());
            setWorkout((prev) => prev ? { ...prev, name: renameValue.trim() } : prev);
            setShowRenameModal(false);
        } catch {
            setError("Failed to rename workout.");
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!workout) return;
        setDeleting(true);
        try {
            await deleteWorkout(workout.id);
            router.push("/history");
        } catch {
            setError("Failed to delete workout.");
            setDeleting(false);
        }
    };

    // --- Edit mode ---
    const enterEditMode = () => {
        if (!workout) return;
        const exercises = workout.workout_exercises.map((we) => ({
            ...we,
            sets: [...we.sets],
        }));
        setWorkoutExercises(exercises);
        // Mark all existing sets as confirmed
        const allIds = new Set<string>();
        workout.workout_exercises.forEach((we) => we.sets.forEach((s) => allIds.add(s.id)));
        setConfirmedSetIds(allIds);
        setEditErrorMessages({});
        setIsEditing(true);
    };

    const saveEditChanges = useCallback(async () => {
        setIsSaving(true);
        try {
            for (const exercise of workoutExercises) {
                for (const set of exercise.sets) {
                    await updateSetApi(set.id, { reps: set.reps, weight: set.weight });
                }
            }
        } catch {
            // silently ignore
        } finally {
            setIsSaving(false);
        }
    }, [workoutExercises, updateSetApi]);

    // Auto-save debounce while editing
    useEffect(() => {
        if (!isEditing) return;
        const t = setTimeout(() => saveEditChanges(), 1500);
        return () => clearTimeout(t);
    }, [workoutExercises, isEditing, saveEditChanges]);

    const doneEditing = async () => {
        await saveEditChanges();
        await fetchWorkoutDetails(); // refresh from server
        setIsEditing(false);
    };

    // --- Exercise search debounce ---
    useEffect(() => {
        if (!isEditing) return;
        const run = async () => {
            if (!searchQuery.trim()) { setSearchResults([]); return; }
            setIsSearching(true);
            try {
                const data = await searchExercises(searchQuery, 10);
                setSearchResults(data as Exercise[]);
            } catch { /* ignore */ } finally {
                setIsSearching(false);
            }
        };
        const t = setTimeout(run, 300);
        return () => clearTimeout(t);
    }, [searchQuery, isEditing, searchExercises]);

    // --- Edit handlers (mirror workout/page.tsx) ---
    const addExerciseToWorkout = async (exercise: Exercise) => {
        if (!workoutId) return;
        try {
            const result = await addExerciseApi(workoutId, exercise.exercise_id, workoutExercises.length);
            const workoutExerciseData = result.workoutExercise as { id: string; order_index: number };
            const firstSet = result.set as WorkoutSet;

            let prefillSets: { reps: number; weight: number }[] = [];
            try {
                const lastRes = await fetch(`/api/exercises/${exercise.exercise_id}/last-session`);
                if (lastRes.ok) {
                    const lastData = await lastRes.json();
                    prefillSets = lastData.sets ?? [];
                }
            } catch { /* ignore */ }

            let sets: WorkoutSet[] = [];
            if (prefillSets.length > 0) {
                await updateSetApi(firstSet.id, { reps: prefillSets[0].reps, weight: prefillSets[0].weight });
                sets.push({ ...firstSet, reps: prefillSets[0].reps, weight: prefillSets[0].weight });
                for (let i = 1; i < prefillSets.length; i++) {
                    const newSet = await addSetApi(workoutExerciseData.id, i + 1);
                    await updateSetApi(newSet.id, { reps: prefillSets[i].reps, weight: prefillSets[i].weight });
                    sets.push({ ...newSet, reps: prefillSets[i].reps, weight: prefillSets[i].weight });
                }
            } else {
                sets = [firstSet];
            }

            setWorkoutExercises((prev) => [
                ...prev,
                {
                    id: workoutExerciseData.id,
                    exercise_id: exercise.exercise_id,
                    exercise,
                    order_index: workoutExerciseData.order_index,
                    sets,
                },
            ]);
            setShowExerciseSearch(false);
            setSearchQuery("");
            setSearchResults([]);
        } catch {
            setEditErrorMessages((prev) => ({ ...prev, general: "Failed to add exercise." }));
        }
    };

    const createCustomExercise = async (name: string, bodyPart: string) => {
        const res = await fetch("/api/custom-exercises", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, body_part: bodyPart || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create exercise");

        const newExercise: Exercise = {
            exercise_id: data.exercise.exercise_id,
            name: data.exercise.name,
            body_parts: data.exercise.body_part ? [data.exercise.body_part] : null,
            is_custom: true,
        };

        setShowCustomExerciseModal(false);
        await addExerciseToWorkout(newExercise);
    };

    const addSetToExercise = async (exerciseIndex: number) => {
        const we = workoutExercises[exerciseIndex];
        if (we.sets.length >= 10) {
            setEditErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Maximum 10 sets." }));
            return;
        }
        try {
            const data = await addSetApi(we.id, we.sets.length + 1);
            setWorkoutExercises((prev) => {
                const updated = [...prev];
                updated[exerciseIndex] = { ...updated[exerciseIndex], sets: [...updated[exerciseIndex].sets, data] };
                return updated;
            });
        } catch {
            setEditErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to add set." }));
        }
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => {
        if (value < 0) return;
        setWorkoutExercises((prev) => {
            const updated = [...prev];
            updated[exerciseIndex] = {
                ...updated[exerciseIndex],
                sets: updated[exerciseIndex].sets.map((s, i) =>
                    i === setIndex ? { ...s, [field]: value } : s
                ),
            };
            return updated;
        });
    };

    const deleteSet = async (exerciseIndex: number, setIndex: number) => {
        const set = workoutExercises[exerciseIndex].sets[setIndex];
        try {
            await deleteSetApi(set.id);
            setWorkoutExercises((prev) => {
                const updated = [...prev];
                const newSets = updated[exerciseIndex].sets
                    .filter((_, i) => i !== setIndex)
                    .map((s, i) => ({ ...s, set_number: i + 1 }));
                updated[exerciseIndex] = { ...updated[exerciseIndex], sets: newSets };
                return updated;
            });
        } catch {
            setEditErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete set." }));
        }
    };

    const deleteExercise = async (exerciseIndex: number) => {
        try {
            await deleteWorkoutExercise(workoutExercises[exerciseIndex].id);
            setWorkoutExercises((prev) => prev.filter((_, i) => i !== exerciseIndex));
        } catch {
            setEditErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete exercise." }));
        }
    };

    const handleConfirmSet = (setId: string) => {
        setConfirmedSetIds((prev) => new Set([...prev, setId]));
    };

    // --- Render ---
    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="flex items-center justify-center h-[50vh]">
                    <LoadingSpinner size={40} />
                </div>
            </ProtectedWrapper>
        );
    }

    if (error || !workout) {
        return (
            <ProtectedWrapper>
                <div className="w-full">
                    <div className="page-header mb-6" style={{ top: 0 }}>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">Workout Details</h1>
                    </div>
                    <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] text-center font-medium">
                        {error || "Workout not found."}
                    </div>
                </div>
            </ProtectedWrapper>
        );
    }

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const totalVolume = workout.workout_exercises.reduce(
        (sum, we) => sum + we.sets.reduce((s, set) => s + set.reps * set.weight, 0),
        0
    );
    const totalSets = workout.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0);

    return (
        <ProtectedWrapper>
            <div className="w-full">
                {/* Header */}
                <div className="page-header mb-4 flex items-center gap-3" style={{ top: 0 }}>
                    <Link
                        href="/history"
                        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow flex-shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] truncate">{workout.name}</h1>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatDate(workout.workout_date)}</p>
                    </div>

                    {isEditing ? (
                        <Button
                            onClick={doneEditing}
                            className="px-3 py-2 text-sm flex-shrink-0"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving…" : "Done Editing"}
                        </Button>
                    ) : (
                        <>
                            <button
                                aria-label="Edit workout"
                                onClick={enterEditMode}
                                className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--primary-600)] dark:text-[var(--primary-500)] hover:shadow-[var(--shadow)] transition-all flex-shrink-0"
                            >
                                <PenSquare className="w-4 h-4" />
                            </button>
                            <button
                                aria-label="Rename workout"
                                onClick={() => { setRenameValue(workout.name); setShowRenameModal(true); }}
                                className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:shadow-[var(--shadow)] transition-all flex-shrink-0"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                aria-label="Delete workout"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:shadow-[var(--shadow)] transition-all flex-shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: "Exercises", value: isEditing ? workoutExercises.length : workout.workout_exercises.length },
                        { label: "Sets", value: isEditing ? workoutExercises.reduce((n, we) => n + we.sets.length, 0) : totalSets },
                        { label: "Volume", value: `${isEditing ? workoutExercises.reduce((n, we) => n + we.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0).toFixed(0) : totalVolume.toFixed(0)} kg` },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-3 sm:p-4 shadow-[var(--shadow)] text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{label}</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] leading-none">{value}</p>
                        </div>
                    ))}
                </div>

                {/* View mode */}
                {!isEditing && (
                    <div className="space-y-4">
                        {workout.workout_exercises.map((we) => (
                            <WorkoutHistoryExerciseCard key={we.id} workoutExercise={we} />
                        ))}
                    </div>
                )}

                {/* Edit mode */}
                {isEditing && (
                    <div className="space-y-4">
                        {editErrorMessages.general && (
                            <div className="p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-md)] text-sm font-medium">
                                {editErrorMessages.general}
                            </div>
                        )}

                        {workoutExercises.length === 0 ? (
                            <div className="text-center py-10 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
                                <p className="text-sm text-[var(--muted-foreground)]">No exercises. Tap &ldquo;Add Exercise&rdquo; to add one.</p>
                            </div>
                        ) : (
                            workoutExercises.map((we, exerciseIndex) => (
                                <WorkoutExerciseCard
                                    key={we.id}
                                    workoutExercise={we}
                                    exerciseIndex={exerciseIndex}
                                    onAddSet={addSetToExercise}
                                    onUpdateSet={updateSet}
                                    onDeleteSet={deleteSet}
                                    onDeleteExercise={deleteExercise}
                                    onConfirmSet={handleConfirmSet}
                                    confirmedSetIds={confirmedSetIds}
                                    errorMessage={editErrorMessages[`exercise-${exerciseIndex}`] || ""}
                                    setErrorMessage={(msg) =>
                                        setEditErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: msg }))
                                    }
                                />
                            ))
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
                            }}
                            onSelectExercise={addExerciseToWorkout}
                            onAddCustomExercise={() => {
                                setShowExerciseSearch(false);
                                setShowCustomExerciseModal(true);
                            }}
                        />
                    </div>
                )}
            </div>

            <AddCustomExerciseModal
                isOpen={showCustomExerciseModal}
                onClose={() => setShowCustomExerciseModal(false)}
                onSubmit={createCustomExercise}
                initialName={searchQuery}
            />

            {/* Rename modal */}
            <ModalWrapper isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} containerClassName="max-w-sm p-4">
                <h3 className="text-base font-bold text-[var(--foreground)] mb-3">Rename Workout</h3>
                <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                    className="w-full px-3 py-2 mb-3 rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                    placeholder="Workout name"
                />
                <div className="flex gap-2">
                    <Button onClick={() => setShowRenameModal(false)} variant="secondary" block>Cancel</Button>
                    <Button onClick={handleRename} block disabled={renaming || !renameValue.trim()}>
                        {renaming ? "Saving…" : "Save"}
                    </Button>
                </div>
            </ModalWrapper>

            {/* Delete modal */}
            <ModalWrapper isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} containerClassName="max-w-sm p-4">
                <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Delete Workout?</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    &ldquo;{workout.name}&rdquo; will be permanently deleted.
                </p>
                <div className="flex gap-2">
                    <Button onClick={() => setShowDeleteModal(false)} variant="secondary" block>Cancel</Button>
                    <Button onClick={handleDelete} variant="danger" block disabled={deleting}>
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                </div>
            </ModalWrapper>
        </ProtectedWrapper>
    );
}
