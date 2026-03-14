"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import WorkoutHistoryExerciseCard from "@/components/WorkoutHistoryExerciseCard";
import { useHistory } from "@/hooks/useHistory";
import type { Workout } from "@/types";

export default function WorkoutDetailPage() {
    const params = useParams();
    const router = useRouter();
    const workoutId = params?.id as string;
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Rename state
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const renameInputRef = useRef<HTMLInputElement>(null);
    const { fetchWorkoutDetail, renameWorkout, deleteWorkout } = useHistory();

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
        if (showRenameModal) {
            setTimeout(() => renameInputRef.current?.focus(), 50);
        }
    }, [showRenameModal]);

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
                    <div className="page-header mb-6">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">Workout Details</h1>
                    </div>
                    <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] text-center font-medium">
                        {error || "Workout not found."}
                    </div>
                </div>
            </ProtectedWrapper>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const totalVolume = workout.workout_exercises.reduce((sum, we) => {
        return sum + we.sets.reduce((s, set) => s + set.reps * set.weight, 0);
    }, 0);

    const totalSets = workout.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0);

    return (
        <ProtectedWrapper>
            <div className="w-full">
                {/* Header with back button + actions */}
                <div className="page-header mb-4 flex items-center gap-3">
                    <Link
                        href="/history"
                        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow flex-shrink-0"
                    >
                        <svg className="w-4 h-4 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] truncate">{workout.name}</h1>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatDate(workout.workout_date)}</p>
                    </div>
                    {/* Action buttons */}
                    <button
                        aria-label="Rename workout"
                        onClick={() => { setRenameValue(workout.name); setShowRenameModal(true); }}
                        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:shadow-[var(--shadow)] transition-all flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        aria-label="Delete workout"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:shadow-[var(--shadow)] transition-all flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: "Exercises", value: workout.workout_exercises.length },
                        { label: "Sets", value: totalSets },
                        { label: "Volume", value: `${totalVolume.toFixed(0)} kg` },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-3 sm:p-4 shadow-[var(--shadow)] text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{label}</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] leading-none">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Exercise cards */}
                <div className="space-y-4">
                    {workout.workout_exercises.map((we) => (
                        <WorkoutHistoryExerciseCard key={we.id} workoutExercise={we} />
                    ))}
                </div>
            </div>

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
