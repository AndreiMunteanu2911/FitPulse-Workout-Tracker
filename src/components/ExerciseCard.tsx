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
    return (
        <div className="h-full flex flex-col rounded-sm p-3 sm:p-4 transition-all duration-100 bg-[var(--primary-500)]/90">
            <div className="flex flex-row items-start justify-between w-full flex-nowrap">
                <div className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2 min-w-0 pr-2">
                    {exercise.name}
                </div>
                {showDetailsButton && (
                    <Link href={`/exercises/${exercise.exercise_id}`} className="mt-1 sm:mt-0">
                        <Button variant="secondary" className="ml-auto whitespace-nowrap">
                            View details
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}