'use client'

import { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { useHistory } from "@/hooks/useHistory";

interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface Set {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise: Exercise;
    order_index: number;
    sets: Set[];
}

interface Workout {
    id: string;
    name: string;
    workout_date: string;
    created_at: string;
    status: string;
    workout_exercises: WorkoutExercise[];
}

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
                <div className="flex items-center justify-center h-[50vh] p-4">
                    <LoadingSpinner size={40} />
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="w-full">
                <div className="sticky top-0 py-4 z-10 text-2xl sm:text-3xl font-semibold text-[var(--foreground)] mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 bg-[var(--surface)]">
                    History
                </div>
                {errorMessages.general && (
                    <div className="mb-4 text-red-600 dark:text-red-400">{errorMessages.general}</div>
                )}
                {workouts.length === 0 ? (
                    <div className="text-[var(--foreground)] text-center py-12 px-4 rounded-lg bg-[var(--surface)]">
                        No completed workouts yet. Start your first workout to see it here!
                    </div>
                ) : (
                    <div className="space-y-4 max-w-full">
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