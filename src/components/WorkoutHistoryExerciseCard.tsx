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

interface WorkoutHistoryExerciseCardProps {
    workoutExercise: WorkoutExercise;
    exerciseIndex: number;
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function WorkoutHistoryExerciseCard({ workoutExercise, exerciseIndex }: WorkoutHistoryExerciseCardProps) {
    return (
        <div className="p-3 sm:p-4 bg-white mb-6 rounded-xs border-b-2 border-[var(--primary-400)]/80">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary-600)] m-0">
                    {capitalize(workoutExercise.exercise.name)}
                </h3>
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
                {workoutExercise.exercise.target_muscles?.length
                    ? workoutExercise.exercise.target_muscles.map((muscle, idx) => (
                        <span key={idx} className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1 text-sm sm:text-base">
                            {capitalize(muscle)}
                          </span>
                    ))
                    : <span className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1 text-sm sm:text-base">—</span>
                }
            </div>
            <div>
                {workoutExercise.sets.map((set) => (
                    <div
                        key={set.id}
                        className="grid grid-cols-2 gap-y-1 gap-x-4 md:flex md:items-center mt-6 md:mt-8 md:ml-2 md:gap-12 mb-2"
                    >
                        <span className="text-gray-700 text-base sm:text-lg">Set {set.set_number}</span>
                        <span className="text-[var(--primary-700)] text-lg sm:text-xl">
                            {set.reps} reps
                        </span>
                        <span className="text-[var(--primary-700)] text-lg sm:text-xl">
                            {set.weight} kg
                        </span>
                        <span className="text-gray-500 text-sm sm:text-base md:ml-auto">
                            Volume: {(set.reps * set.weight).toFixed(1)} kg
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}