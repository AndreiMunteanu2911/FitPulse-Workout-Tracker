"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import { Exercise } from "@/components/ExerciseCard";

export default function ExerciseDetailsPage() {
    const { id } = useParams();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercise = async () => {
            const { data, error } = await supabase
                .from("exercises")
                .select("*")
                .eq("exercise_id", id)
                .single();

            if (error) {
                console.error("Error fetching exercise:", error);
            } else {
                setExercise(data);
            }
            setLoading(false);
        };

        fetchExercise();
    }, [id]);

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="p-4">Loading exercise details...</div>
            </ProtectedWrapper>
        );
    }

    if (!exercise) {
        return (
            <ProtectedWrapper>
                <div className="p-4 text-red-600">Exercise not found.</div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{exercise.name}</h1>
                        {exercise.body_parts?.length ? (
                            <div className="flex flex-wrap gap-2">
                                {exercise.body_parts.map((part, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        {part}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Exercise GIF */}
                        {exercise.gif_url && (
                            <div className="mb-8 bg-gray-50 rounded-lg overflow-hidden">
                                <img
                                    src={exercise.gif_url}
                                    alt={exercise.name}
                                    className="w-full max-w-md mx-auto h-auto rounded-lg"
                                />
                            </div>
                        )}

                        {/* Exercise Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Overview Card */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Exercise Details</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Target Muscles</h3>
                                        <p className="mt-1 text-gray-700">{exercise.target_muscles?.join(", ") || "—"}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Equipment</h3>
                                        <p className="mt-1 text-gray-700">
                                            {exercise.equipments?.length ? (
                                                exercise.equipments.join(", ")
                                            ) : "None"}
                                        </p>
                                    </div>
                                    {exercise.secondary_muscles?.length ? (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Secondary Muscles</h3>
                                            <p className="mt-1 text-gray-700">{exercise.secondary_muscles.join(", ")}</p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Instructions Card */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">How to Perform</h2>
                                {exercise.instructions?.length ? (
                                    <ol className="space-y-4">
                                        {exercise.instructions.map((step, idx) => (
                                            <li key={idx} className="flex">
                                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mr-3">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-gray-700">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-gray-500 italic">No instructions available for this exercise.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedWrapper>
    );
}
