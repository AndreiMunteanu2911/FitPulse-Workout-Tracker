import Button from "./Button";

interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface ExerciseSearchModalProps {
    isOpen: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Exercise[];
    isSearching: boolean;
    onClose: () => void;
    onSelectExercise: (exercise: Exercise) => void;
}

export default function ExerciseSearchModal({
    isOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    onClose,
    onSelectExercise,
}: ExerciseSearchModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-sm p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Search Exercises</h3>
                <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border rounded-sm px-3 py-2 w-full mb-4"
                    autoFocus
                />
                {isSearching && <p className="text-gray-500">Searching...</p>}
                <div className="space-y-2">
                    {searchResults.map((exercise) => (
                        <div
                            key={exercise.exercise_id}
                            onClick={() => onSelectExercise(exercise)}
                            className="p-3 border rounded-sm hover:bg-gray-100 cursor-pointer"
                        >
                            <div className="font-medium">{exercise.name}</div>
                            {exercise.target_muscles && exercise.target_muscles.length > 0 && (
                                <div className="text-sm text-gray-600">
                                    {exercise.target_muscles.join(", ")}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <Button onClick={onClose} className="mt-4 w-full">
                    Close
                </Button>
            </div>
        </div>
    );
}