"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import IconButton from "@/components/IconButton";
import WorkoutHistoryExerciseCard from "@/components/WorkoutHistoryExerciseCard";

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

    useEffect(() => {
        if (!workoutId) return;
        fetchWorkoutDetails();
    }, [workoutId]);

    const fetchWorkoutDetails = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from("workouts")
                .select(`*, workout_exercises (*, exercise:exercises (*), sets (*))`)
                .eq("id", workoutId)
                .eq("user_id", user.id)
                .single();
            if (error || !data) throw error || new Error("Workout not found");
            // Sort exercises and sets
            data.workout_exercises = data.workout_exercises
                .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
                .map((we: { sets: any[] }) => ({
                    ...we,
                    sets: we.sets.sort((a, b) => a.set_number - b.set_number),
                }));
            setWorkout(data);
            setError(null);
        } catch (err) {
            setError("Failed to fetch workout details.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="min-w-full p-4">

                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size={40} />
                    </div>
                </div>
            </ProtectedWrapper>
        );
    }

    if (error || !workout) {
        return (
            <ProtectedWrapper>
                <div className="min-w-full p-4">
                    <div className="text-gray-700 font-bold text-3xl mb-6">Workout Details</div>
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
            <div className="min-w-full p-4">
                <div className="flex flex-row">
                    <Link href="/history"><IconButton image="/assets/arrow-white.svg" variant="primary" className="mr-4"></IconButton></Link>
                    <div className="text-gray-700 font-bold text-3xl mb-6">{workout.name}</div>
                </div>
                <div className="mb-2 text-gray-600">{formatDate(workout.workout_date)}</div>
                <div className="space-y-6 mt-6">
                    {workout.workout_exercises.map((we, idx) => (
                        <WorkoutHistoryExerciseCard key={we.id} workoutExercise={we} exerciseIndex={idx} />
                    ))}
                </div>
            </div>
        </ProtectedWrapper>
    );
}
