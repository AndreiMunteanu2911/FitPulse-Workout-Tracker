'use client'

import { useState, useEffect, useCallback } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import ExerciseCard from "@/components/WorkoutExerciseCard";
import ExerciseSearchModal from "@/components/ExerciseSearchModal";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import CancelWorkoutModal from "@/components/CancelWorkoutModal";
import FinishWorkoutModal from "@/components/FinishWorkoutModal";

interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise: Exercise;
    order_index: number;
    sets: Set[];
}

interface Set {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
}

export default function WorkoutPage() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutName, setWorkoutName] = useState("My Workout");
    const [workoutId, setWorkoutId] = useState<string | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});

    const [showExerciseSearch, setShowExerciseSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [isSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [noDraftFound, setNoDraftFound] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

    useEffect(() => {
        const checkForDraftWorkout = async () => {
            setIsLoading(true);
            setNoDraftFound(false);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    setNoDraftFound(true);
                    return;
                }

                const { data, error } = await supabase
                    .from("workouts")
                    .select(`*,workout_exercises (*,exercise:exercises (*),sets (*))`)
                    .eq("user_id", user.id)
                    .eq("status", "draft")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code !== "PGRST116") throw error;

                if (data) {
                    setWorkoutId(data.id);
                    setWorkoutName(data.name);
                    const exercises = (data.workout_exercises || []).map((we: unknown) => {
                        const workoutExercise = we as WorkoutExercise;
                        return {
                            id: workoutExercise.id,
                            exercise_id: workoutExercise.exercise_id,
                            exercise: workoutExercise.exercise,
                            order_index: workoutExercise.order_index,
                            sets: (workoutExercise.sets || []).sort((a: Set, b: Set) => a.set_number - b.set_number),
                        };
                    });
                    setWorkoutExercises(exercises);
                    setWorkoutStarted(true);
                    setErrorMessages({});
                } else {
                    setNoDraftFound(true);
                }
            } catch (error) {
                console.error("Error checking for draft workout:", error);
                setErrorMessages((prev) => ({ ...prev, general: "Failed to check for draft workout." }));
                setNoDraftFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkForDraftWorkout();
    }, []);

    const saveWorkoutToDB = useCallback(async () => {
        if (!workoutId) return;
        try {
            await supabase
                .from("workouts")
                .update({ name: workoutName })
                .eq("id", workoutId);

            for (const exercise of workoutExercises) {
                for (const set of exercise.sets) {
                    await supabase
                        .from("sets")
                        .update({
                            reps: set.reps,
                            weight: set.weight,
                        })
                        .eq("id", set.id);
                }
            }
        } catch (error) {
            console.error("Error saving workout:", error);
        }
    }, [workoutId, workoutName, workoutExercises]);

    useEffect(() => {
        if (!workoutStarted || !workoutId) return;

        const autoSave = setTimeout(async () => {
            await saveWorkoutToDB();
        }, 2000);

        return () => clearTimeout(autoSave);
    }, [workoutExercises, workoutStarted, workoutId, saveWorkoutToDB]);


    const startWorkout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("workouts")
                .insert({
                    user_id: user.id,
                    workout_date: new Date().toISOString().split('T')[0],
                    name: workoutName,
                    status: "draft",
                })
                .select()
                .single();

            if (error) throw error;

            setWorkoutId(data.id);
            setWorkoutStarted(true);
        } catch (error) {
            console.error("Error starting workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to start workout." }));
        }
    };

    const finishWorkout = async () => {
        if (!workoutId) return;

        try {
            await saveWorkoutToDB();

            const { error } = await supabase
                .from("workouts")
                .update({ status: "completed" })
                .eq("id", workoutId);

            if (error) throw error;

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
            setErrorMessages({});
        } catch (error) {
            console.error("Error finishing workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to finish workout." }));
        }
    };

    const handleCancelWorkout = () => {
        setShowCancelModal(true);
    };

    const confirmCancelWorkout = async () => {
        if (!workoutId) return;
        try {
            const { error } = await supabase
                .from("workouts")
                .delete()
                .eq("id", workoutId);

            if (error) throw error;

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
            setErrorMessages({});
            setNoDraftFound(true);
        } catch (error) {
            console.error("Error canceling workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to cancel workout." }));
        } finally {
            setShowCancelModal(false);
        }
    };

    const addExerciseToWorkout = async (exercise: Exercise) => {
        if (!workoutId) return;

        try {
            const { data: workoutExerciseData, error: exerciseError } = await supabase
                .from("workout_exercises")
                .insert({
                    workout_id: workoutId,
                    exercise_id: exercise.exercise_id,
                    order_index: workoutExercises.length,
                })
                .select()
                .single();

            if (exerciseError) throw exerciseError;

            const { data: setData, error: setError } = await supabase
                .from("sets")
                .insert({
                    workout_exercise_id: workoutExerciseData.id,
                    set_number: 1,
                    reps: 0,
                    weight: 0,
                })
                .select()
                .single();

            if (setError) throw setError;

            setWorkoutExercises([
                ...workoutExercises,
                {
                    id: workoutExerciseData.id,
                    exercise_id: exercise.exercise_id,
                    exercise: exercise,
                    order_index: workoutExerciseData.order_index,
                    sets: [setData],
                },
            ]);

            setShowExerciseSearch(false);
            setSearchQuery("");
            setSearchResults([]);
            setErrorMessages((prev) => ({ ...prev, search: "" }));
        } catch (error) {
            console.error("Error adding exercise:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to add exercise." }));
        }
    };

    const addSetToExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];
        if (workoutExercise.sets.length >= 10) {
            setErrorMessages((prev) => ({
                ...prev,
                [`exercise-${exerciseIndex}`]: "Maximum 10 sets per exercise.",
            }));
            return;
        }

        try {
            const setNumber = workoutExercise.sets.length + 1;
            const { data, error } = await supabase
                .from("sets")
                .insert({
                    workout_exercise_id: workoutExercise.id,
                    set_number: setNumber,
                    reps: 0,
                    weight: 0,
                })
                .select()
                .single();

            if (error) throw error;

            const updatedExercises = [...workoutExercises];
            updatedExercises[exerciseIndex] = {
                ...updatedExercises[exerciseIndex],
                sets: [...updatedExercises[exerciseIndex].sets, data],
            };
            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error adding set:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to add set." }));
        }
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
        const errorKey = `exercise-${exerciseIndex}-set-${setIndex}-${field}`;
        if (value < 0) {
            setErrorMessages((prev) => ({
                ...prev,
                [errorKey]: `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative.`,
            }));
            return;
        }

        const updatedExercises = [...workoutExercises];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...updatedExercises[exerciseIndex].sets[setIndex],
            [field]: value,
        };
        setWorkoutExercises(updatedExercises);
        setErrorMessages((prev) => ({ ...prev, [errorKey]: "" }));
    };

    const deleteSet = async (exerciseIndex: number, setIndex: number) => {
        const set = workoutExercises[exerciseIndex].sets[setIndex];

        try {
            const { error } = await supabase
                .from("sets")
                .delete()
                .eq("id", set.id);

            if (error) throw error;

            const updatedExercises = [...workoutExercises];
            updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
            updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((s, idx) => ({
                ...s,
                set_number: idx + 1,
            }));

            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error deleting set:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete set." }));
        }
    };

    const deleteExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];

        try {
            const { error } = await supabase
                .from("workout_exercises")
                .delete()
                .eq("id", workoutExercise.id);

            if (error) throw error;

            const updatedExercises = [...workoutExercises];
            updatedExercises.splice(exerciseIndex, 1);
            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error deleting exercise:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete exercise." }));
        }
    };

    return (
        <ProtectedWrapper>
            <div className="w-full p-4 md:p-8 mx-auto max-w-4xl">
                {isLoading ? (
                    <div className="flex justify-center items-center h-[60vh]">
                        <LoadingSpinner size={8} />
                    </div>
                ) : (
                    <>
                        {errorMessages.general && (
                            <div className="mb-4 text-red-600">{errorMessages.general}</div>
                        )}
                        <div className="sticky top-0 py-4 bg-white/95 backdrop-blur-sm z-10 flex justify-between items-center mb-6">
                            <div className="text-2xl sm:text-3xl text-gray-700 font-semibold">Workout</div>
                            {!workoutStarted ? (
                                <Button onClick={startWorkout} className="px-4 py-2 text-sm sm:text-base">Start New Workout</Button>
                            ) : (
                                <Button onClick={() => setIsFinishModalOpen(true)} className="px-4 py-2 text-sm sm:text-base">Finish Workout</Button>
                            )}
                        </div>
                        <FinishWorkoutModal
                            isOpen={isFinishModalOpen}
                            onClose={() => setIsFinishModalOpen(false)}
                            onConfirm={() => {
                                setIsFinishModalOpen(false);
                                finishWorkout();
                            }}
                        />
                        {noDraftFound && !workoutStarted && (
                            <div className="text-center text-[var(--primary-700)] text-base sm:text-xl mb-8 py-4 rounded-lg">
                                Start a new workout today!
                            </div>
                        )}
                        {workoutStarted && (
                            <div className="space-y-6 sm:space-y-8 mt-4">
                                <div className="p-2 border border-blue-700/80 rounded-md bg-white">
                                    <label className="block mb-1 text-sm text-[var(--primary-800)] font-medium">Workout Name</label>
                                    <input
                                        type="text"
                                        value={workoutName}
                                        onChange={(e) => setWorkoutName(e.target.value)}
                                        className="w-full px-1 py-0.5 text-gray-700 text-lg sm:text-xl font-bold border-none focus:outline-none bg-transparent"
                                    />
                                </div>

                                {workoutExercises.length === 0 ? (
                                    <div className="text-center text-[var(--primary-700)] py-8 rounded-lg">
                                        No exercises added yet. Click &quot;Add Exercise&quot; to start.
                                    </div>
                                ) : (
                                    <div className="space-y-4 sm:space-y-6">
                                        {workoutExercises.map((workoutExercise, exerciseIndex) => (
                                            <ExerciseCard
                                                key={workoutExercise.id}
                                                workoutExercise={workoutExercise}
                                                exerciseIndex={exerciseIndex}
                                                onAddSet={addSetToExercise}
                                                onUpdateSet={updateSet}
                                                onDeleteSet={deleteSet}
                                                onDeleteExercise={deleteExercise}
                                                errorMessage={errorMessages[`exercise-${exerciseIndex}`] || ""}
                                                setErrorMessage={(message: string) =>
                                                    setErrorMessages((prev) => ({
                                                        ...prev,
                                                        [`exercise-${exerciseIndex}`]: message,
                                                    }))
                                                }
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-center pt-2">
                                    <Button onClick={() => setShowExerciseSearch(true)} className="py-2.5 px-8 text-base">
                                        Add Exercise
                                    </Button>
                                </div>

                                <ExerciseSearchModal
                                    isOpen={showExerciseSearch}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchResults={searchResults}
                                    isSearching={isSearching}
                                    onClose={() => {
                                        setShowExerciseSearch(false);
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setErrorMessages((prev) => ({ ...prev, search: "" }));
                                    }}
                                    onSelectExercise={addExerciseToWorkout}
                                />

                                <div className="flex justify-center pt-4">
                                    <Button onClick={handleCancelWorkout} variant="textOnly" className="text-sm">Cancel Workout</Button>
                                </div>
                                <CancelWorkoutModal
                                    isOpen={showCancelModal}
                                    onClose={() => setShowCancelModal(false)}
                                    onConfirm={confirmCancelWorkout}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </ProtectedWrapper>
    );
}