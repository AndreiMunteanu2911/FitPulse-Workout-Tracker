import Link from "next/link";
import Button from "@/components/Button";

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
}

export default function ExerciseCard({ exercise, showDetailsButton = true }: ExerciseCardProps) {
    return (<div className="h-full flex flex-col rounded-sm p-4 transition-all duration-100 bg-[var(--primary-500)]/90">
            <div className="flex flex-row items-center justify-between w-full">
                <div className="text-lg font-semibold text-white mb-2 line-clamp-2">{exercise.name}</div>
                {showDetailsButton && (<Link href={`/exercises/${exercise.exercise_id}`}>
                        <Button variant="secondary" className="ml-4 whitespace-nowrap">View details</Button>
                    </Link>)}
            </div>
            {/*<div className="mt-3 pt-3 border-t border-[var(--primary-100)]">
                    <span className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        View details →
                    </span>
                </div>*/}
        </div>
    );
}
