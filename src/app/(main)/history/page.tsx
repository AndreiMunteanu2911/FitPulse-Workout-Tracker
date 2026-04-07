'use client'

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import { useHistory } from "@/hooks/useHistory";
import type { Workout } from "@/types";
import { Clock, PenSquare, Trash2, Plus } from "lucide-react";

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
        const newName = renameValue.trim();
        const prev = workouts;
        setWorkouts((w) => w.map((w) => w.id === renameTarget.id ? { ...w, name: newName } : w));
        setRenameTarget(null);
        try {
            await renameWorkout(renameTarget.id, newName);
        } catch {
            setWorkouts(prev);
            setErrorMessages({ general: "Failed to rename workout." });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const targetId = deleteTarget.id;
        const prev = workouts;
        setWorkouts((w) => w.filter((w) => w.id !== targetId));
        setDeleteTarget(null);
        try {
            await deleteWorkout(targetId);
        } catch {
            setWorkouts(prev);
            setErrorMessages({ general: "Failed to delete workout." });
        }
    };

    const totalVolume = workouts.reduce((sum, w) => {
        return sum + w.workout_exercises.reduce((es, we) => es + we.sets.reduce((ss, s) => ss + s.reps * s.weight, 0), 0);
    }, 0);

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="w-full">
                    <div className="bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-400)] rounded-[var(--radius-lg)] p-6 mb-5">
                        <Skeleton className="mb-4 bg-white/20" width={120} height={20} />
                        <div className="grid grid-cols-3 gap-3">
                            <Skeleton className="bg-white/20" height={50} />
                            <Skeleton className="bg-white/20" height={50} />
                            <Skeleton className="bg-white/20" height={50} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5">
                                <Skeleton width={100} className="mb-2" />
                                <Skeleton width={200} className="mb-3" />
                                <div className="flex gap-2">
                                    <Skeleton width={80} height={24} />
                                    <Skeleton width={80} height={24} />
                                    <Skeleton width={80} height={24} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="w-full">
                {/* ── Purple Hero Header ── */}
                <div className="bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-500)] to-[var(--primary-400)] text-white rounded-[var(--radius-lg)] overflow-hidden mb-5">
                    <div className="px-6 pt-6 pb-5">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--font-poppins)" }}>
                                <Clock className="w-5 h-5" />
                                Workout Log
                            </h1>
                            <Button onClick={() => router.push("/workout")} variant="lime" className="px-4 py-2 text-xs">
                                <Plus className="w-4 h-4 mr-1" />
                                New
                            </Button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
                            <div className="text-center">
                                <p className="text-lg font-extrabold">{workouts.length}</p>
                                <p className="text-[10px] text-white/60 uppercase tracking-wide">Workouts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-extrabold">{totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + "k" : totalVolume}</p>
                                <p className="text-[10px] text-white/60 uppercase tracking-wide">Volume (kg)</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-extrabold">{prCounts.size > 0 ? Array.from(prCounts.values()).reduce((a, b) => a + b, 0) : 0}</p>
                                <p className="text-[10px] text-white/60 uppercase tracking-wide">PRs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {errorMessages.general && (
                    <div className="mb-4 p-4 rounded-[var(--radius-md)] bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] text-sm font-medium">{errorMessages.general}</div>
                )}

                {workouts.length === 0 ? (
                    <div className="text-center py-14 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-[var(--radius-md)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
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
                                <div className="flex flex-col gap-1.5 justify-center flex-shrink-0">
                                    <button
                                        aria-label="Rename workout"
                                        onClick={() => { setRenameTarget(workout); setRenameValue(workout.name); }}
                                        className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                                    >
                                        <PenSquare className="w-4 h-4" />
                                    </button>
                                    <button
                                        aria-label="Delete workout"
                                        onClick={() => setDeleteTarget(workout)}
                                        className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rename Modal */}
            <ModalWrapper isOpen={!!renameTarget} onClose={() => setRenameTarget(null)} containerClassName="max-w-sm p-5">
                <h3 className="text-base font-bold text-[var(--foreground)] mb-3">Rename Workout</h3>
                <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                    className="w-full px-4 py-3 mb-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                    placeholder="Workout name"
                />
                <div className="flex gap-2">
                    <Button onClick={() => setRenameTarget(null)} variant="secondary" block>Cancel</Button>
                    <Button onClick={handleRename} block disabled={renaming || !renameValue.trim()}>
                        {renaming ? "Saving…" : "Save"}
                    </Button>
                </div>
            </ModalWrapper>

            {/* Delete Modal */}
            <ModalWrapper isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} containerClassName="max-w-sm p-5">
                <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Delete Workout?</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    &ldquo;{deleteTarget?.name}&rdquo; will be permanently deleted.
                </p>
                <div className="flex gap-2">
                    <Button onClick={() => setDeleteTarget(null)} variant="primary" block>Cancel</Button>
                    <Button onClick={handleDelete} variant="secondary" block disabled={deleting}>
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                </div>
            </ModalWrapper>
        </ProtectedWrapper>
    );
}
