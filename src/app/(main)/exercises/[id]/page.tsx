"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useExercises } from "@/hooks/useExercises";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import PersonalRecordCard from "@/components/PersonalRecordCard";
import ExerciseStatsTab from "@/components/ExerciseStatsTab";
import FormChecker from "@/components/FormChecker";
import FormHistoryPanel from "@/components/FormHistoryPanel";
import Button from "@/components/Button";
import type { Exercise, PersonalRecord, ExerciseFormRules } from "@/types";
import { ChevronLeft, Sparkles, Camera } from "lucide-react";

function ExerciseThumbnail({ src }: { src: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full h-full bg-[var(--surface-raised)] overflow-hidden">
            {!loaded && <Skeleton className="absolute inset-0" />}
            <img
                src={src}
                alt=""
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
    const [activeTab, setActiveTab] = useState<"description" | "stats">("description");
    const [showFormChecker, setShowFormChecker] = useState(false);
    const [formHistoryKey, setFormHistoryKey] = useState(0);
    const { fetchExercise } = useExercises();
    const { fetchPersonalRecords } = usePersonalRecords();

    useEffect(() => {
        const loadExercise = async () => {
            try {
                const data = await fetchExercise(id as string);
                setExercise(data);
                // Custom exercises only have a stats tab
                if (data?.is_custom) setActiveTab("stats");
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
                <div className="w-full">
                    <div className="page-header mb-4 flex items-center gap-3" style={{ top: 0 }}>
                        <Skeleton circle width={36} height={36} />
                        <Skeleton width={160} height={28} />
                    </div>
                    <div className="flex gap-1 p-1 bg-[var(--surface-raised)] rounded-[var(--radius-md)] mb-5 w-fit">
                        <Skeleton width={100} height={32} />
                        <Skeleton width={60} height={32} />
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 mb-5">
                        <Skeleton className="w-full md:w-56 aspect-square rounded-lg" />
                        <div className="flex-1 bg-[var(--surface)] rounded-[var(--radius-md)] p-5 space-y-4">
                            <Skeleton width={100} height={16} />
                            <div className="flex flex-wrap gap-1.5">
                                <Skeleton width={70} height={24} />
                                <Skeleton width={80} height={24} />
                            </div>
                            <Skeleton width={80} height={16} />
                            <div className="flex flex-wrap gap-1.5">
                                <Skeleton width={60} height={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-5 mb-6">
                        <Skeleton width={100} height={16} className="mb-3" />
                        <Skeleton className="mb-2" />
                        <Skeleton className="mb-2" />
                        <Skeleton width="80%" />
                    </div>
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
                <div className="page-header mb-4 flex items-center gap-3" style={{ top: 0 }}>
                    <Link
                        href="/exercises"
                        className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--surface)] transition-shadow flex-shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" />
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] truncate">{capitalize(exercise.name)}</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[var(--surface-raised)] rounded-[var(--radius-md)] mb-5 w-fit">
                    {!exercise.is_custom && (
                        <button
                            onClick={() => setActiveTab("description")}
                            className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-all ${
                                activeTab === "description"
                                    ? "bg-[var(--surface)] text-[var(--foreground)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                        >
                            Description
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-all ${
                            activeTab === "stats"
                                ? "bg-[var(--surface)] text-[var(--foreground)]"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                    >
                        Stats
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "description" ? (
                    <>
                        {/* Hero section */}
                        <div className="flex flex-col md:flex-row gap-5 mb-5">
                            {exercise.gif_url && (
                                <div className="w-full md:w-56 flex-shrink-0">
                                    <div className="rounded-[var(--radius-md)] overflow-hidden bg-[var(--surface)] aspect-square md:w-56 md:h-56 mx-auto">
                                        <ExerciseThumbnail src={exercise.gif_url} />
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5 space-y-4">
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
                            <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5 mb-6">
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
                                <div className="text-center py-10 bg-[var(--surface)] rounded-[var(--radius-md)]">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                                    </div>
                                    <p className="text-sm text-[var(--muted-foreground)]">No personal record yet. Log this exercise to see your PR!</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mb-8">
                        <ExerciseStatsTab exerciseId={id as string} />
                    </div>
                )}

                {/* Check My Form Button — shown in description tab for non-custom exercises */}
                {activeTab === "description" && !exercise.is_custom && (
                    <div className="mb-6">
                        <div className="w-full rounded-[var(--radius-lg)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-xs)]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)]">
                                    <Camera className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-base font-bold text-[var(--foreground)]"
                                        style={{ fontFamily: "var(--font-poppins)" }}
                                    >
                                        Check My Form
                                    </p>
                                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                                        Use your camera to get real-time feedback and a post-set coach review.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowFormChecker(true)}
                                    variant="primary"
                                    className="flex-shrink-0 px-5 py-2 text-sm sm:px-5 sm:py-2"
                                >
                                    Go
                                </Button>
                            </div>
                        </div>

                        {/* Recent form sessions */}
                        <div className="mt-4">
                            <FormHistoryPanel key={formHistoryKey} exerciseId={id as string} />
                        </div>
                    </div>
                )}
            </div>

            {/* Full-screen Form Checker */}
            {showFormChecker && (
                <FormChecker
                    exerciseId={exercise.exercise_id}
                    exerciseName={exercise.name}
                    formRules={(exercise as Exercise & { form_rules?: ExerciseFormRules | null }).form_rules ?? null}
                    onClose={() => {
                        setShowFormChecker(false);
                        setFormHistoryKey((k) => k + 1);
                    }}
                />
            )}
        </ProtectedWrapper>
    );
}
