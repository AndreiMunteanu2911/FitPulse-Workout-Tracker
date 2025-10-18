import Button from "./Button";
import ExerciseCard from "./ExerciseCard";
import LoadingSpinner from "./LoadingSpinner";

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
        <div className="fixed inset-0 bg-black/50 h-full w-full flex items-center justify-center z-50">
            <div className="bg-white rounded-sm p-6 min-w-1/2 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Search Exercises</h3>
                <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-blue-700/80 rounded-sm w-full px-4 py-3 bg-white/10 placeholder-white/70 text-gray-700 focus:bg-white/20"
                    autoFocus
                />
                {isSearching && <LoadingSpinner size={10} className="mx-auto my-4" />}
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-3">
                    {searchResults.map((exercise) => (
                        <div key={exercise.exercise_id} onClick={() => onSelectExercise(exercise)} className="cursor-pointer">
                            <ExerciseCard exercise={{ ...exercise, name: exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1) }} showDetailsButton={false} />
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