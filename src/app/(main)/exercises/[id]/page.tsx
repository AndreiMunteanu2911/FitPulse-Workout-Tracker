"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { useExercises } from "@/hooks/useExercises";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import PersonalRecordCard from "@/components/PersonalRecordCard";
import type { Exercise, PersonalRecord } from "@/types";

function ImageWithSpinner({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full h-full">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <LoadingSpinner size={5} variant="image" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

export default function ExerciseDetailsPage() {
    const { id } = useParams();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [personalRecord, setPersonalRecord] = useState<PersonalRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const { fetchExercise } = useExercises();
    const { fetchPersonalRecords } = usePersonalRecords();

    useEffect(() => {
        const loadExercise = async () => {
            try {
                const data = await fetchExercise(id as string);
                setExercise(data);
                const allRecords = await fetchPersonalRecords();
                const recordForExercise = (allRecords as PersonalRecord[]).find((r) => r.exercise_id === id);
                setPersonalRecord(recordForExercise || null);
            } catch (error) {
                console.error("Error fetching exercise:", error);
            }
            setLoading(false);
        };
        loadExercise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="flex justify-center items-center h-[60vh]">
                    <LoadingSpinner size={8} />
                </div>
            </ProtectedWrapper>
        );
    }

    if (!exercise) {
        return (
            <ProtectedWrapper>
                <div className="p-6">Exercise not found.</div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="w-full">
                {/* Back header */}
                <div className="page-header mb-4 flex items-center gap-3">
                    <Link
                        href="/exercises"
                        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow flex-shrink-0"
                    >
                        <svg className="w-4 h-4 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] truncate">{capitalize(exercise.name)}</h1>
                </div>

                {/* Hero section */}
                <div className="flex flex-col md:flex-row gap-5 mb-6">
                    {exercise.gif_url && (
                        <div className="w-full md:w-64 flex-shrink-0">
                            <div className="rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow)] bg-[var(--surface)] aspect-square md:w-64 md:h-64 mx-auto">
                                <ImageWithSpinner src={exercise.gif_url} alt={exercise.name + " demo"} />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5 space-y-4">
                        {exercise.target_muscles?.length ? (
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Target Muscles</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercise.target_muscles.map((m, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-500)] text-white capitalize">{capitalize(m)}</span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {exercise.secondary_muscles?.length ? (
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Secondary Muscles</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercise.secondary_muscles.map((m, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)] capitalize">{capitalize(m)}</span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {exercise.equipments?.length ? (
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Equipment</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercise.equipments.map((e, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)] capitalize">{capitalize(e)}</span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {exercise.body_parts?.length ? (
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Body Parts</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercise.body_parts.map((p, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)] capitalize">{capitalize(p)}</span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Instructions */}
                {exercise.instructions?.length ? (
                    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5 mb-6">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Instructions</h2>
                        <ol className="space-y-2.5">
                            {exercise.instructions.map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm text-[var(--foreground)]">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center text-[10px] font-bold text-[var(--primary-600)] dark:text-[var(--primary-700)]">{i + 1}</span>
                                    <span className="leading-relaxed">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : (
                    <div className="text-sm text-[var(--muted-foreground)] mb-6">No instructions available for this exercise.</div>
                )}

                {/* Personal Record */}
                <div className="mb-8">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Your Personal Record</h2>
                    {personalRecord ? (
                        <PersonalRecordCard record={personalRecord} />
                    ) : (
                        <div className="text-center py-10 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)]">No personal record yet. Log this exercise to see your PR!</p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedWrapper>
    );
}
