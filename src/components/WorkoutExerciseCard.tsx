import Button from "./Button";

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

interface ExerciseCardProps {
    workoutExercise: WorkoutExercise;
    exerciseIndex: number;
    onAddSet: (exerciseIndex: number) => void;
    onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
    onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
    onDeleteExercise: (exerciseIndex: number) => void;
    errorMessage: string;
    setErrorMessage: (message: string) => void;
}

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function WorkoutExerciseCard({
    workoutExercise,
    exerciseIndex,
    onAddSet,
    onUpdateSet,
    onDeleteSet,
    onDeleteExercise,
    errorMessage,
    setErrorMessage,
}: ExerciseCardProps) {
    return (
        <div className="p-4 bg-white mb-6 rounded-xs border-b-2 border-[var(--primary-400)]/80">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-xl text-[var(--primary-600)] m-0">
                    {capitalizeFirstLetter(workoutExercise.exercise.name)}
                </h3>
                <Button
                    variant="textOnly"
                    aria-label="Delete exercise"
                    onClick={() => onDeleteExercise(exerciseIndex)}
                    className="ml-2 text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                    <span className="font-bold text-lg">×</span>
                    <span className="text-base">Delete Exercise</span>
                </Button>
            </div>
            {errorMessage && (
                <div className="text-red-600 text-base mb-2">{errorMessage}</div>
            )}
            <div>
                {workoutExercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="flex items-center gap-4 mb-2">
                        <span className="text-gray-700 text-lg font-normals min-w-[50px]">Set {set.set_number}</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                placeholder="Reps"
                                value={set.reps || ""}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    onUpdateSet(exerciseIndex, setIndex, "reps", value);
                                    setErrorMessage("");
                                }}
                                min="0"
                                className="px-2 py-1 text-base bg-gray-200 text-gray-800 border-none rounded"
                            />
                            <span className="text-gray-500 text-md">reps</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                placeholder="Weight"
                                value={set.weight || ""}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    onUpdateSet(exerciseIndex, setIndex, "weight", value);
                                    setErrorMessage("");
                                }}
                                min="0"
                                step="0.5"
                                className=" ml-2 px-2 py-1 text-base bg-gray-200 text-gray-800 border-none rounded"
                            />
                            <span className="text-gray-500 text-md">kg</span>
                        </div>
                        <Button
                            variant="textOnly"
                            aria-label="Delete set"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onDeleteSet(exerciseIndex, setIndex);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 font-bold text-2xl"
                        >
                            × <span className="text-sm font-semibold ml-1">Delete set</span>
                        </Button>
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-2">
                <Button
                    variant="textOnly"
                    onClick={() => onAddSet(exerciseIndex)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mr-1 align-middle">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Set
                </Button>
            </div>
        </div>
    );
}
