'use client'

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import { useHistory } from "@/hooks/useHistory";
import type { Workout } from "@/types";
import { Clock, PenSquare, Trash2 } from "lucide-react";

function computePrCountsPerWorkout(workouts: Workout[]): Map<string, number> {
    const sorted = [...workouts].sort(
        (a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
    );
    const runningMax = new Map<string, number>();
    const prCounts = new Map<string, number>();

    for (const w of sorted) {
        let prCount = 0;
        for (const we of w.workout_exercises) {
            const maxWeight = we.sets.reduce((m, s) => Math.max(m, s.weight), 0);
            const prev = runningMax.get(we.exercise_id) ?? 0;
            if (maxWeight > 0 && maxWeight > prev) {
                prCount++;
                runningMax.set(we.exercise_id, maxWeight);
            }
        }
        prCounts.set(w.id, prCount);
    }
    return prCounts;
}

export default function HistoryPage() {
    const router = useRouter();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessages, setErrorMessages] = useState<{ general?: string }>({});
    const [prCounts, setPrCounts] = useState<Map<string, number>>(new Map());

    const [renameTarget, setRenameTarget] = useState<Workout | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Workout | null>(null);
    const [deleting, setDeleting] = useState(false);

    const renameInputRef = useRef<HTMLInputElement>(null);
    const { fetchHistory, renameWorkout, deleteWorkout } = useHistory();

    useEffect(() => {
        fetchWorkoutHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (renameTarget) {
            setTimeout(() => renameInputRef.current?.focus(), 50);
        }
    }, [renameTarget]);

    const fetchWorkoutHistory = async () => {
        try {
            const data = await fetchHistory();
            setWorkouts(data);
            setPrCounts(computePrCountsPerWorkout(data));
            setErrorMessages({});
        } catch (error) {
            console.error("Error fetching workout history:", error);
            setErrorMessages({ general: "Failed to fetch workout history." });
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async () => {
        if (!renameTarget || !renameValue.trim()) return;
        setRenaming(true);
        try {
            await renameWorkout(renameTarget.id, renameValue.trim());
            setWorkouts((prev) =>
                prev.map((w) => w.id === renameTarget.id ? { ...w, name: renameValue.trim() } : w)
            );
            setRenameTarget(null);
        } catch {
            setErrorMessages({ general: "Failed to rename workout." });
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteWorkout(deleteTarget.id);
            setWorkouts((prev) => prev.filter((w) => w.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch {
            setErrorMessages({ general: "Failed to delete workout." });
        } finally {
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

    return (
        <ProtectedWrapper>
            <div className="w-full">
                <div className="page-header mb-6">
                    <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">History</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{workouts.length} completed workout{workouts.length !== 1 ? "s" : ""}</p>
                </div>

                {errorMessages.general && (
                    <div className="mb-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] text-sm font-medium">{errorMessages.general}</div>
                )}

                {workouts.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow)]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                            <Clock className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No workouts yet</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">Complete your first workout to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workouts.map((workout) => (
                            <div key={workout.id} className="flex items-stretch gap-2">
                                <button
                                    className="flex-1 text-left min-w-0"
                                    onClick={() => router.push(`/history/${workout.id}`)}
                                >
                                    <WorkoutHistoryCard workout={workout} prCount={prCounts.get(workout.id)} />
                                </button>
                                <div className="flex flex-col gap-1 justify-center flex-shrink-0">
                                    <button
                                        aria-label="Rename workout"
                                        onClick={() => { setRenameTarget(workout); setRenameValue(workout.name); }}
                                        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:shadow-[var(--shadow)] transition-all"
                                    >
                                        <PenSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        aria-label="Delete workout"
                                        onClick={() => setDeleteTarget(workout)}
                                        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:shadow-[var(--shadow)] transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ModalWrapper isOpen={!!renameTarget} onClose={() => setRenameTarget(null)} containerClassName="max-w-sm p-4">
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
                    <Button onClick={() => setRenameTarget(null)} variant="secondary" block>Cancel</Button>
                    <Button onClick={handleRename} block disabled={renaming || !renameValue.trim()}>
                        {renaming ? "Saving…" : "Save"}
                    </Button>
                </div>
            </ModalWrapper>

            <ModalWrapper isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} containerClassName="max-w-sm p-4">
                <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Delete Workout?</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    &ldquo;{deleteTarget?.name}&rdquo; will be permanently deleted.
                </p>
                <div className="flex gap-2">
                    <Button onClick={() => setDeleteTarget(null)} variant="secondary" block>Cancel</Button>
                    <Button onClick={handleDelete} variant="danger" block disabled={deleting}>
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                </div>
            </ModalWrapper>
        </ProtectedWrapper>
    );
}
