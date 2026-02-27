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
            
            <div className="relative mb-3">
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 pl-8 text-[var(--foreground)] bg-[var(--surface)] border-b-2 border-[var(--border)] placeholder-[var(--muted-foreground)] focus:border-[var(--primary-500)] focus:outline-none rounded-none transition-colors text-base"
                    autoFocus
                />
                <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            
            {isSearching && <LoadingSpinner size={10} className="mx-auto my-4" />}
            
            <div className="space-y-2 overflow-y-auto max-h-[60vh] -mx-2 px-2">
                {searchResults.length === 0 && !isSearching && searchQuery.trim() !== "" && (
                    <div className="text-center text-[var(--muted-foreground)] py-8">
                        No exercises found for "{searchQuery}"
                    </div>
                )}
                {searchResults.map((exercise) => (
                    <div key={exercise.exercise_id} onClick={() => onSelectExercise(exercise)} className="cursor-pointer">
                        <ExerciseCard 
                            exercise={{ ...exercise, name: exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1) }} 
                            showDetailsButton={false}
                            showAnimation={false}
                        />
                    </div>
                ))}
            </div>
            
            <Button onClick={onClose} className="mt-4 w-full" variant="secondary">
                Close
            </Button>
        </ModalWrapper>
    );
}
