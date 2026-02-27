import Button from "./Button";
import ExerciseCard from "./ExerciseCard";
import LoadingSpinner from "./LoadingSpinner";
import ModalWrapper from "./ModalWrapper";

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
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-md sm:max-w-lg p-4 sm:p-6">
            <h3 className="text-xl font-bold mb-4 text-[var(--foreground)]">Search Exercises</h3>
            <input
                type="text"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-blue-700/80 rounded-sm w-full px-4 py-3 bg-[var(--surface)] placeholder-[var(--muted-foreground)] text-[var(--foreground)] focus:bg-[var(--surface)]/80 mb-4"
                autoFocus
            />
            {isSearching && <LoadingSpinner size={10} className="mx-auto my-4" />}
            <div className="space-y-2 overflow-y-auto pr-3 flex-grow max-h-[60vh]">
                {searchResults.map((exercise) => (
                    <div key={exercise.exercise_id} onClick={() => onSelectExercise(exercise)} className="cursor-pointer">
                        <ExerciseCard exercise={{ ...exercise, name: exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1) }} showDetailsButton={false} />
                    </div>
                ))}
            </div>
            <Button onClick={onClose} className="mt-4 w-full">
                Close
            </Button>
        </ModalWrapper>
    );
}
