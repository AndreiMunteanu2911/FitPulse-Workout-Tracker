'use client'

import { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { useHistory } from "@/hooks/useHistory";
import type { Workout } from "@/types";

export default function HistoryPage() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessages, setErrorMessages] = useState<{ general?: string }>({});
    const { fetchHistory } = useHistory();

    useEffect(() => {
        fetchWorkoutHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchWorkoutHistory = async () => {
        try {
            const data = await fetchHistory();
            setWorkouts(data);
            setErrorMessages({});
        } catch (error) {
            console.error("Error fetching workout history:", error);
            setErrorMessages({ general: "Failed to fetch workout history." });
        } finally {
            setLoading(false);
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
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">History</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{workouts.length} completed workout{workouts.length !== 1 ? "s" : ""}</p>
                </div>

                {errorMessages.general && (
                    <div className="mb-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] text-sm font-medium">{errorMessages.general}</div>
                )}

                {workouts.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow)]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                            <svg className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No workouts yet</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">Complete your first workout to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workouts.map((workout) => (
                            <Link key={workout.id} href={`/history/${workout.id}`} className="block">
                                <WorkoutHistoryCard workout={workout} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedWrapper>
    );
}
