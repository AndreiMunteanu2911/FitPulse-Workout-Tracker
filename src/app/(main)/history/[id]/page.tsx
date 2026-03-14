"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import WorkoutHistoryExerciseCard from "@/components/WorkoutHistoryExerciseCard";
import { useHistory } from "@/hooks/useHistory";
import type { Workout } from "@/types";

export default function WorkoutDetailPage() {
    const params = useParams();
    const workoutId = params?.id as string;
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { fetchWorkoutDetail } = useHistory();

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
                {/* Header with back button */}
                <div className="page-header mb-4 flex items-center gap-3">
                    <Link
                        href="/history"
                        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow flex-shrink-0"
                    >
                        <svg className="w-4 h-4 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] truncate">{workout.name}</h1>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatDate(workout.workout_date)}</p>
                    </div>
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
        </ProtectedWrapper>
    );
}
