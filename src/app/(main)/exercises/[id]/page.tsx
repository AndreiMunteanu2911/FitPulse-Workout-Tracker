"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import { Exercise } from "@/components/ExerciseCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import IconButton from "@/components/IconButton";
import Image from "next/image";

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
                <div className="flex justify-center items-center h-screen-minus-header">
                    <LoadingSpinner size={8} />
                </div>
            </ProtectedWrapper>
        );
    }

    if (!exercise) {
        return (
            <ProtectedWrapper>
                <div className="p-4 md:p-8">Exercise not found.</div>
            </ProtectedWrapper>
        );
    }

    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

    return (
        <ProtectedWrapper>
            <div className="p-4 mx-auto max-w-4xl lg:max-w-6xl">
                <div className="flex items-center mb-6 pt-2">
                    <Link href="/exercises" className="mr-3 sm:mr-4">
                        <IconButton image="/assets/arrow-white.svg" variant="primary" className="p-2 sm:p-3" />
                    </Link>
                    <h1 className="text-2xl sm:text-3xl text-gray-700 font-semibold">{capitalize(exercise.name)}</h1>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6 sm:gap-8 mb-6">
                    {exercise.gif_url && (
                        <div className="w-full md:w-auto flex justify-center md:block">
                            <Image
                                src={exercise.gif_url}
                                alt={exercise.name + ' demo'}
                                width={300}
                                height={300}
                                className="w-full h-auto max-w-xs sm:max-w-sm md:w-[300px] md:h-[300px] object-contain rounded-md"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-4 w-full">
                        <div>
                            <h2 className="text-lg sm:text-xl text-gray-700 font-semibold mb-1">Target Muscles</h2>
                            <div className="flex flex-wrap gap-2">
                                {exercise.target_muscles?.length
                                    ? exercise.target_muscles.map((muscle, idx) => (
                                        <span key={idx} className="inline-block rounded-full bg-[color:var(--primary-500)] text-white text-sm px-3 py-1">
                                            {capitalize(muscle)}
                                        </span>
                                    ))
                                    : <span className="inline-block rounded-full bg-[color:var(--primary-500)] text-white text-sm px-3 py-1">—</span>
                                }
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg sm:text-xl text-gray-700 font-semibold mb-1">Equipment</h2>
                            <div className="flex flex-wrap gap-2">
                                {exercise.equipments?.length
                                    ? exercise.equipments.map((eq, idx) => (
                                        <span key={idx} className="inline-block rounded-full bg-[color:var(--primary-500)] text-white text-sm px-3 py-1">
                                            {capitalize(eq)}
                                        </span>
                                    ))
                                    : <span className="inline-block rounded-full bg-[color:var(--primary-500)] text-white text-sm px-3 py-1">None</span>
                                }
                            </div>
                        </div>

                        {exercise.secondary_muscles?.length ? (
                            <div>
                                <h2 className="text-lg sm:text-xl text-gray-700 font-semibold mb-1">Secondary Muscles</h2>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.secondary_muscles.map((muscle, idx) => (
                                        <span key={idx} className="inline-block rounded-full bg-[color:var(--primary-500)] text-white text-sm px-3 py-1">
                                            {capitalize(muscle)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {exercise.body_parts?.length ? (
                            <div>
                                <h2 className="text-lg sm:text-xl text-gray-700 font-semibold mb-1">Body Parts</h2>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.body_parts.map((part, idx) => (
                                        <span key={idx} className="inline-block rounded-full bg-[color:var(--primary-500)] text-white text-sm px-3 py-1">
                                            {capitalize(part)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {exercise.instructions?.length ? (
                    <div className="mb-4">
                        <h2 className="text-xl text-gray-700 font-semibold mb-2">Instructions</h2>
                        <ol className="list-decimal list-inside space-y-2">
                            {exercise.instructions.map((step, idx) => (
                                <li key={idx} className="text-gray-600">{step}</li>
                            ))}
                        </ol>
                    </div>
                ) : (
                    <p className="text-gray-600">No instructions available for this exercise.</p>
                )}
            </div>
        </ProtectedWrapper>
    );
}