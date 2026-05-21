import Link from "next/link";
import Button from "@/components/Button";
import { useState } from "react";
import { Dumbbell } from "lucide-react";
import type { Exercise } from "@/types";

export type { Exercise };

interface ExerciseCardProps {
    exercise: Exercise;
    showDetailsButton?: boolean;
    onClick?: () => void;
    showAnimation?: boolean;
}

function ExerciseThumbnail({ src }: { src: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-full h-full bg-[var(--surface-raised)] overflow-hidden">
            {!loaded && <div className="absolute inset-0 bg-[var(--surface-raised)]" />}
            <img
                src={src}
                alt=""
                className={`w-full h-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export default function ExerciseCard({ exercise, showDetailsButton = true, onClick }: ExerciseCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group flex items-center gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)] transition-all duration-200 ${
                onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:scale-[0.99]" : ""
            }`}
        >
            {exercise.is_custom ? (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary-50)] to-[var(--surface-raised)] dark:from-[var(--primary-100)]">
                    <Dumbbell className="w-7 h-7 text-[var(--primary-500)]" />
                </div>
            ) : exercise.gif_url ? (
                <div className="flex-shrink-0 w-16 h-16 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-raised)]">
                    <ExerciseThumbnail src={exercise.gif_url} />
                </div>
            ) : null}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--foreground)] truncate group-hover:text-[var(--primary-600)]" style={{ fontFamily: "var(--font-poppins)" }}>
                        {exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1)}
                    </h3>
                </div>
                {exercise.target_muscles?.[0] && (
                    <p className="mt-1 inline-flex rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-bold capitalize text-[var(--muted-foreground)]">
                        {exercise.target_muscles[0]}
                    </p>
                )}
            </div>

            {showDetailsButton && (
                <Link href={`/exercises/${exercise.exercise_id}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="primary" className="px-4 py-2 text-xs font-semibold whitespace-nowrap">
                        Details
                    </Button>
                </Link>
            )}
        </div>
    );
}
