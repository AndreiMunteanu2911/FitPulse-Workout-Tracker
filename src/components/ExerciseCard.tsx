import Link from "next/link";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
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

function ImageWithSpinner({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    
    return (
        <div className="relative w-full h-full">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <LoadingSpinner size={3} variant="image" />
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

export default function ExerciseCard({ exercise, showDetailsButton = true, onClick }: ExerciseCardProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 bg-[var(--surface)] rounded-[var(--radius-xl)] p-3.5 shadow-[var(--shadow)] transition-all duration-200 ${
                onClick ? "cursor-pointer hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 active:scale-[0.99]" : ""
            }`}
        >
            {exercise.is_custom ? (
                <div className="flex-shrink-0 w-14 h-14 rounded-[var(--radius-md)] bg-[var(--surface-raised)] flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-[var(--primary-500)]" />
                </div>
            ) : exercise.gif_url ? (
                <div className="flex-shrink-0 w-14 h-14 rounded-[var(--radius-md)] overflow-hidden bg-[var(--surface-raised)]">
                    <ImageWithSpinner src={exercise.gif_url} alt={exercise.name} />
                </div>
            ) : null}
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate">
                        {exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1)}
                    </h3>
                </div>
                {exercise.target_muscles?.[0] && (
                    <p className="text-xs text-[var(--muted-foreground)] capitalize mt-0.5">
                        {exercise.target_muscles[0]}
                    </p>
                )}
            </div>
            
            {showDetailsButton && (
                <Link href={`/exercises/${exercise.exercise_id}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap">
                        Details
                    </Button>
                </Link>
            )}
        </div>
    );
}
