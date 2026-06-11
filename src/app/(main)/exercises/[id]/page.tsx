"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    BarChart3,
    BookOpen,
    Camera,
    Sparkles,
    Trophy,
} from "lucide-react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import PersonalRecordCard from "@/components/PersonalRecordCard";
import ExerciseStatsTab from "@/components/ExerciseStatsTab";
import FormChecker from "@/components/FormChecker";
import FormHistoryPanel from "@/components/FormHistoryPanel";
import Button from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useExercises } from "@/hooks/useExercises";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import type { Exercise, ExerciseFormRules, PersonalRecord } from "@/types";

function ExerciseThumbnail({ src }: { src: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="relative h-full w-full overflow-hidden bg-[var(--surface-raised)]">
            {!loaded && <div className="absolute inset-0 bg-[var(--surface-raised)]" />}
            <img
                src={src}
                alt=""
                className={`h-full w-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

const capitalize = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

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
                if (data?.is_custom) setActiveTab("stats");

                const allRecords = await fetchPersonalRecords();
                const recordForExercise = (allRecords as PersonalRecord[]).find((record) => record.exercise_id === id);
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
                <div className="flex min-h-[18rem] w-full items-center justify-center">
                    <LoadingSpinner />
                </div>
            </ProtectedWrapper>
        );
    }

    if (!exercise) {
        return (
            <ProtectedWrapper>
                <div className="card p-8 text-center">
                    <h1 className="text-lg font-bold text-[var(--foreground)]">Exercise not found</h1>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">This exercise may have been removed.</p>
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="page-stack">
                <PageHeader
                    title={capitalize(exercise.name)}
                    description="Technique guidance, muscle focus, and your performance history."
                    backHref="/exercises"
                />

                <div className="inline-flex w-full gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] p-1 sm:w-auto">
                    {!exercise.is_custom && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("description")}
                            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all sm:flex-none ${
                                activeTab === "description"
                                    ? "bg-[var(--surface)] text-[var(--primary-600)] shadow-[var(--shadow-xs)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                        >
                            <BookOpen className="size-4" />
                            Description
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setActiveTab("stats")}
                        className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all sm:flex-none ${
                            activeTab === "stats"
                                ? "bg-[var(--surface)] text-[var(--primary-600)] shadow-[var(--shadow-xs)]"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                    >
                        <BarChart3 className="size-4" />
                        Stats
                    </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                {activeTab === "description" ? (
                    <motion.div
                        key="description"
                        className="space-y-5"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                        <section className="card relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[var(--primary-500)] via-[var(--primary-400)] to-[var(--lime-green)]" />
                            <div className={`grid ${exercise.gif_url ? "lg:grid-cols-[minmax(15rem,0.7fr)_1.3fr]" : ""}`}>
                                {exercise.gif_url && (
                                    <div className="h-64 bg-[var(--surface-raised)] p-2 sm:h-72 lg:h-auto lg:min-h-[20rem]">
                                        <div className="h-full w-full">
                                            <ExerciseThumbnail src={exercise.gif_url} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-5 p-5 sm:p-6">
                                    {exercise.target_muscles?.length ? (
                                        <div>
                                            <h2 className="eyebrow !mb-2">Target muscles</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {exercise.target_muscles.map((muscle) => (
                                                    <span key={muscle} className="badge bg-[var(--primary-500)] text-white capitalize">
                                                        {capitalize(muscle)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {exercise.secondary_muscles?.length ? (
                                        <div>
                                            <h2 className="eyebrow !mb-2">Secondary muscles</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {exercise.secondary_muscles.map((muscle) => (
                                                    <span key={muscle} className="badge badge-soft capitalize">{capitalize(muscle)}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {exercise.equipments?.length ? (
                                        <div>
                                            <h2 className="eyebrow !mb-2">Equipment</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {exercise.equipments.map((equipment) => (
                                                    <span key={equipment} className="badge border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] capitalize">
                                                        {capitalize(equipment)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {exercise.body_parts?.length ? (
                                        <div>
                                            <h2 className="eyebrow !mb-2">Body parts</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {exercise.body_parts.map((part) => (
                                                    <span key={part} className="badge border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] capitalize">
                                                        {capitalize(part)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {exercise.instructions?.length ? (
                            <section className="card p-5 sm:p-7">
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="icon-tile"><BookOpen className="size-5" /></span>
                                    <div>
                                        <p className="eyebrow !mb-1">Technique</p>
                                        <h2 className="text-xl font-bold text-[var(--foreground)]">How to perform it</h2>
                                    </div>
                                </div>
                                <ol className="grid gap-3 md:grid-cols-2">
                                    {exercise.instructions.map((step, index) => (
                                        <li
                                            key={`${index}-${step}`}
                                            className="flex gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4 text-sm text-[var(--foreground)]"
                                        >
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-500)] text-xs font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <span className="leading-6">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        ) : (
                            <div className="card p-8 text-center text-sm text-[var(--muted-foreground)]">
                                No instructions are available for this exercise.
                            </div>
                        )}

                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <Trophy className="size-4 text-[var(--primary-600)]" />
                                <h2 className="eyebrow !mb-0">Your personal record</h2>
                            </div>
                            {personalRecord ? (
                                <PersonalRecordCard record={personalRecord} />
                            ) : (
                                <div className="card p-8 text-center">
                                    <span className="icon-tile mx-auto mb-3"><Sparkles className="size-5" /></span>
                                    <h3 className="font-bold text-[var(--foreground)]">No personal record yet</h3>
                                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                        Log this exercise in a workout to start tracking your best set.
                                    </p>
                                </div>
                            )}
                        </section>

                        {!exercise.is_custom && (
                            <>
                                <section className="card relative overflow-hidden p-5 sm:p-6">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--primary-500)] to-[var(--lime-green)]" />
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                        <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] text-white shadow-[0_10px_24px_rgba(116,87,245,0.22)]">
                                            <Camera className="size-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="eyebrow !mb-1">Camera coach</p>
                                            <h2 className="text-lg font-bold text-[var(--foreground)]">Check your form</h2>
                                            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                                                Get real-time cues and a review after your set.
                                            </p>
                                        </div>
                                        <Button onClick={() => setShowFormChecker(true)} variant="primary" className="shrink-0">
                                            Start check
                                        </Button>
                                    </div>
                                </section>

                                <FormHistoryPanel key={formHistoryKey} exerciseId={id as string} />
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="stats"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                        <ExerciseStatsTab exerciseId={id as string} />
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {showFormChecker && (
                <FormChecker
                    exerciseId={exercise.exercise_id}
                    exerciseName={exercise.name}
                    formRules={(exercise as Exercise & { form_rules?: ExerciseFormRules | null }).form_rules ?? null}
                    onClose={() => {
                        setShowFormChecker(false);
                        setFormHistoryKey((key) => key + 1);
                    }}
                />
            )}
        </ProtectedWrapper>
    );
}
