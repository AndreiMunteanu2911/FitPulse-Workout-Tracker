"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import IconButton from "@/components/IconButton";
import WorkoutHistoryExerciseCard from "@/components/WorkoutHistoryExerciseCard";
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
                <div className="flex items-center justify-center h-[50vh] p-4">
                    <LoadingSpinner size={40} />
                </div>
            </ProtectedWrapper>
        );
    }

    if (error || !workout) {
        return (
            <ProtectedWrapper>
                <div className="w-full p-4 md:p-8 mx-auto max-w-4xl">
                    <div className="text-gray-700 font-bold text-2xl sm:text-3xl mb-6">Workout Details</div>
                    <div className="text-red-600 py-8 text-center">{error || "Workout not found."}</div>
                </div>
            </ProtectedWrapper>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <ProtectedWrapper>
            <div className="w-full p-4 md:p-8 mx-auto max-w-4xl">
                <div className="flex items-center mb-4 pt-2">
                    <Link href="/history" className="mr-3 sm:mr-4">
                        <IconButton image="/assets/arrow-white.svg" variant="primary" className="p-2 sm:p-3" />
                    </Link>
                    <div className="text-gray-700 font-bold text-2xl sm:text-3xl">{workout.name}</div>
                </div>

                <div className="mb-4 sm:mb-6 text-gray-600 text-base sm:text-lg">{formatDate(workout.workout_date)}</div>
                <div className="space-y-4 sm:space-y-6 mt-6">
                    {workout.workout_exercises.map((we) => (
                        <WorkoutHistoryExerciseCard key={we.id} workoutExercise={we} />
                    ))}
                </div>
            </div>
        </ProtectedWrapper>
    );
}