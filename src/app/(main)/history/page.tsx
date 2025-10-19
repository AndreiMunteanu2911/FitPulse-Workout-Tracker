'use client'

import { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

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

    useEffect(() => {
        fetchWorkoutHistory();
    }, []);

    const fetchWorkoutHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("workouts")
                .select(`
                    *,
                    workout_exercises (
                        *,
                        exercise:exercises (*),
                        sets (*)
                    )
                `)
                .eq("user_id", user.id)
                .eq("status", "completed")
                .order("workout_date", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
            }

            const processedWorkouts = data?.map((workout) => ({
                ...workout,
                workout_exercises: workout.workout_exercises
                    .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
                    .map((we: { sets: unknown[] }) => ({
                        ...we,
                        sets: (we.sets as Set[]).sort((a, b) => a.set_number - b.set_number),
                    })),
            })) || [];

            setWorkouts(processedWorkouts);
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
            <div className="w-full p-4 md:p-8 mx-auto max-w-4xl">
                <div className="text-2xl sm:text-3xl sticky top-0 py-4 bg-white/95 backdrop-blur-sm z-10 text-gray-700 font-semibold mb-6">
                    History
                </div>
                {errorMessages.general && (
                    <div className="mb-4 text-red-600">{errorMessages.general}</div>
                )}
                {workouts.length === 0 ? (
                    <div className="text-[var(--primary-700)] text-center py-12 px-4 rounded-lg ">
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