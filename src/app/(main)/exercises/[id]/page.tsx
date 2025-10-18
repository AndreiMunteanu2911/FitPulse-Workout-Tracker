"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import { Exercise } from "@/components/ExerciseCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import IconButton from "@/components/IconButton";

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
                <LoadingSpinner size={8} />
            </ProtectedWrapper>
        );
    }

    if (!exercise) {
        return (
            <ProtectedWrapper>
                <div>Exercise not found.</div>
            </ProtectedWrapper>
        );
    }

    // Capitalize first letter utility
    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

    return (
        <ProtectedWrapper>
            <div className="p-4 mx-auto md:pl-12">
                <div className="flex flex-row">
                    <Link href="/exercises"><IconButton image="/assets/arrow-white.svg" variant="primary" className="mr-4"></IconButton></Link>
                    <h1 className="text-3xl text-gray-700 font-semibold mb-6">{capitalize(exercise.name)}</h1>
                </div>
                <div className="flex flex-row items-start gap-8 mb-6">
                    {exercise.gif_url && (
                        <img src={exercise.gif_url} alt={exercise.name + ' demo'} style={{ height: '300px', width: '300px', objectFit: 'contain' }} />
                    )}
                    <div className="flex flex-col gap-4 ml-4">
                        <div>
                            <h2 className="text-xl text-gray-700 font-semibold mb-1">Target Muscles</h2>
                            <div className="flex flex-wrap gap-2">
                                {exercise.target_muscles?.length
                                    ? exercise.target_muscles.map((muscle, idx) => (
                                        <span key={idx} className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">
                                            {capitalize(muscle)}
                                        </span>
                                    ))
                                    : <span className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">—</span>
                                }
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl text-gray-700 font-semibold mb-1">Equipment</h2>
                            <div className="flex flex-wrap gap-2">
                                {exercise.equipments?.length
                                    ? exercise.equipments.map((eq, idx) => (
                                        <span key={idx} className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">
                                            {capitalize(eq)}
                                        </span>
                                    ))
                                    : <span className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">None</span>
                                }
                            </div>
                        </div>
                        {exercise.secondary_muscles?.length ? (
                            <div>
                                <h2 className="text-xl text-gray-700 font-semibold mb-1">Secondary Muscles</h2>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.secondary_muscles.map((muscle, idx) => (
                                        <span key={idx} className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">
                                            {capitalize(muscle)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {exercise.body_parts?.length ? (
                            <div>
                                <h2 className="text-xl text-gray-700 font-semibold mb-1">Body Parts</h2>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.body_parts.map((part, idx) => (
                                        <span key={idx} className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">
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
                        <ol className="list-inside">
                            {exercise.instructions.map((step, idx) => (
                                <li key={idx}>{step}</li>
                            ))}
                        </ol>
                    </div>
                ) : (
                    <p>No instructions available for this exercise.</p>
                )}
            </div>
        </ProtectedWrapper>
    );
}
