import Link from "next/link";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useState } from "react";

export interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string | null;
    target_muscles?: string[] | null;
    body_parts?: string[] | null;
    equipments?: string[] | null;
    secondary_muscles?: string[] | null;
    instructions?: string[] | null;
}

interface ExerciseCardProps {
    exercise: Exercise;
    showDetailsButton?: boolean;
    onClick?: () => void;
    showAnimation?: boolean;
}

function ImageWithSpinner({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    
    return (
        <div className="relative w-full h-full bg-transparent">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
                    <LoadingSpinner size={3} variant="image" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export default function ExerciseCard({ exercise, showDetailsButton = true, onClick, showAnimation = true }: ExerciseCardProps) {
    return (
        <div 
            onClick={onClick}
            className={`flex items-center gap-3 rounded-md p-3 transition-all duration-100 border-2 ${
                onClick ? 'cursor-pointer hover:border-[var(--primary-400)] dark:hover:border-[var(--primary-300)]' : ''
            } bg-[var(--surface)] border-[var(--primary-600)] dark:border-[var(--primary-500)]`}
        >
            {exercise.gif_url && (
                <div className="flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden bg-transparent">
                    <ImageWithSpinner src={exercise.gif_url} alt={exercise.name} />
                </div>
            )}
            
            <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] truncate">
                    {exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1)}
                </h3>
                {exercise.target_muscles?.[0] && (
                    <p className="text-xs text-[var(--muted-foreground)] capitalize mt-0.5">
                        {exercise.target_muscles[0]}
                    </p>
                )}
            </div>
            
            {showDetailsButton && (
                <Link href={`/exercises/${exercise.exercise_id}`} className="flex-shrink-0">
                    <Button variant="primary" className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap rounded-md">
                        Details
                    </Button>
                </Link>
            )}
        </div>
    );
}
