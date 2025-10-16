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
        <div className="border-2 border-blue-100 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{workoutExercise.exercise.name}</h3>
                <button
                    onClick={() => onDeleteExercise(exerciseIndex)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label="Delete exercise"
                />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
            </div>
            {errorMessage && (
                <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-md">{errorMessage}</div>
            )}
            <div className="space-y-3 mb-4 border border-blue-200 rounded-md p-4">
                {workoutExercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                        <span className="font-medium w-12 text-gray-600">Set {set.set_number}</span>
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
                                className="border border-gray-300 rounded px-2 py-1 w-16 text-center focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                min="0"
                            />
                            <span className="text-sm text-gray-500">reps</span>
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
                                className="border border-gray-300 rounded px-2 py-1 w-20 text-center focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                min="0"
                                step="0.5"
                            />
                            <span className="text-sm text-gray-500">kg</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSet(exerciseIndex, setIndex);
                            }}
                            className="ml-auto text-gray-400 hover:text-red-500 transition-colors p-1"
                            aria-label="Delete set"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => onAddSet(exerciseIndex)}
                className="w-full py-2 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Set
            </button>
        </div>
    );
}