import Link from "next/link";

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
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
    return (
        <Link href={`/exercises/${exercise.exercise_id}`} className="block h-full">
            <div className="h-full flex flex-col border-2 border-blue-100 rounded-lg p-4 transition-all duration-200 bg-white hover:shadow-lg hover:border-blue-200 hover:translate-y-[-2px]">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{exercise.name}</h3>
                    {exercise.body_parts?.length ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {exercise.body_parts.slice(0, 3).map((part, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    {part}
                                </span>
                            ))}
                            {exercise.body_parts.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500">
                                    +{exercise.body_parts.length - 3} more
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 mt-1">No body parts listed</p>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        View details →
                    </span>
                </div>
            </div>
        </Link>
    );
}
