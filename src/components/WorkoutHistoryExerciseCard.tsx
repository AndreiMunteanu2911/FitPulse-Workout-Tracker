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
        <div className="p-4 bg-white mb-6 rounded-xs border-b-2 border-[var(--primary-400)]/80">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-xl text-[var(--primary-600)] m-0">
                    {capitalize(workoutExercise.exercise.name)}
                </h3>
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
                {workoutExercise.exercise.target_muscles?.length
                    ? workoutExercise.exercise.target_muscles.map((muscle, idx) => (
                        <span key={idx} className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">
                            {capitalize(muscle)}
                        </span>
                    ))
                    : <span className="inline-block rounded-4xl bg-[color:var(--primary-500)] text-white px-3 py-1">—</span>
                }
            </div>
            <div>
                {workoutExercise.sets.map((set) => (
                    <div key={set.id} className="flex items-center mt-8 ml-2 gap-12 mb-2">
                        <span className="text-gray-700 text-lg">Set {set.set_number}</span>
                        <span className="text-[var(--primary-700)] text-xl">{set.reps} reps</span>
                        <span className="text-[var(--primary-700)] text-xl">{set.weight} kg</span>
                        <span className="text-gray-500 text-base">Volume: {(set.reps * set.weight).toFixed(1)} kg</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
