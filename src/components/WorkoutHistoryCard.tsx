interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface Set {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise: Exercise;
    order_index: number;
    sets: Set[];
}

interface Workout {
    id: string;
    name: string;
    workout_date: string;
    created_at: string;
    status: string;
    workout_exercises: WorkoutExercise[];
}

interface WorkoutHistoryCardProps {
    workout: Workout;
}

export default function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const calculateTotalVolume = (workout: Workout) => {
        let totalVolume = 0;
        workout.workout_exercises.forEach((we) => {
            we.sets.forEach((set) => {
                totalVolume += set.reps * set.weight;
            });
        });
        return totalVolume.toFixed(1);
    };

    const calculateTotalSets = (workout: Workout) => {
        return workout.workout_exercises.reduce((total, we) => total + we.sets.length, 0);
    };

    return (
        <div className="border-2 border-[var(--primary-200)] rounded-sm overflow-hidden cursor-pointer">
            <div className="bg-white p-4 hover:bg-[var(--primary-100)] transition-colors">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-[var(--primary-800)]">{workout.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{formatDate(workout.workout_date)}</p>
                        <div className="flex gap-6 text-sm font-normal text-white">
                            <span className="bg-[var(--primary-600)] rounded-full py-1 px-3">
                                <strong>{workout.workout_exercises.length}</strong> exercises
                            </span>
                            <span className="bg-[var(--primary-600)] rounded-full py-1 px-3">
                                <strong>{calculateTotalSets(workout)}</strong> sets
                            </span>
                            <span className="bg-[var(--primary-600)] rounded-full py-1 px-3">
                                <strong>{calculateTotalVolume(workout)}</strong> kg total volume
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}