'use client'

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import ModalWrapper from "@/components/ModalWrapper";
import ShareWorkoutModal from "@/components/ShareWorkoutModal";
import Button from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useHistory } from "@/hooks/useHistory";
import type { Workout } from "@/types";
import { Clock, Plus } from "lucide-react";

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

    const [shareTarget, setShareTarget] = useState<Workout | null>(null);
    const [sharing, setSharing] = useState(false);

    const renameInputRef = useRef<HTMLInputElement>(null);
    const { fetchHistory, renameWorkout, deleteWorkout, shareWorkout } = useHistory();

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

    const handleShare = async () => {
        if (!shareTarget) return;
        setSharing(true);
        try {
            await shareWorkout(shareTarget.id);
            setShareTarget(null);
            router.push("/social");
        } catch {
            setErrorMessages({ general: "Failed to share workout." });
        } finally {
            setSharing(false);
        }
    };

    const totalVolume = workouts.reduce((sum, w) => {
        return sum + w.workout_exercises.reduce((es, we) => es + we.sets.reduce((ss, s) => ss + s.reps * s.weight, 0), 0);
    }, 0);

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="flex min-h-[18rem] w-full items-center justify-center">
                    <LoadingSpinner />
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="page-stack">
                <PageHeader
                    title="History"
                    description="Review completed workouts and personal records."
                    actions={
                        <Button onClick={() => router.push("/workout")} className="px-4 py-2 text-xs">
                            <Plus className="w-4 h-4" />
                            New workout
                        </Button>
                    }
                />
                <div className="metric-strip grid-cols-3">
                    <div className="metric-item">
                        <p className="metric-value">{workouts.length}</p>
                        <p className="metric-label">Workouts</p>
                    </div>
                    <div className="metric-item">
                        <p className="metric-value">{totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + "k" : totalVolume}</p>
                        <p className="metric-label">Volume (kg)</p>
                    </div>
                    <div className="metric-item">
                        <p className="metric-value">{prCounts.size > 0 ? Array.from(prCounts.values()).reduce((a, b) => a + b, 0) : 0}</p>
                        <p className="metric-label">PRs</p>
                    </div>
                </div>

                {errorMessages.general && (
                    <div className="mb-4 p-4 rounded-[var(--radius-md)] bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] text-sm font-medium">{errorMessages.general}</div>
                )}

                {workouts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h3 className="empty-state-title">No workouts yet</h3>
                        <p className="empty-state-description">Complete your first workout to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workouts.map((workout) => (
                            <WorkoutHistoryCard
                                key={workout.id}
                                workout={workout}
                                prCount={prCounts.get(workout.id)}
                                onOpen={() => router.push(`/history/${workout.id}`)}
                                onShare={() => setShareTarget(workout)}
                                onRename={() => { setRenameTarget(workout); setRenameValue(workout.name); }}
                                onDelete={() => setDeleteTarget(workout)}
                            />
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
                    <Button onClick={handleDelete} variant="danger" block disabled={deleting}>
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                </div>
            </ModalWrapper>

            {/* Share Modal */}
            <ShareWorkoutModal
                isOpen={!!shareTarget}
                workoutName={shareTarget?.name}
                onClose={() => setShareTarget(null)}
                onConfirm={handleShare}
                isSharing={sharing}
            />
        </ProtectedWrapper>
    );
}
