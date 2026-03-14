import Button from "./Button";
import ExerciseCard from "./ExerciseCard";
import LoadingSpinner from "./LoadingSpinner";
import ModalWrapper from "./ModalWrapper";
import type { Exercise } from "@/types";
import { Search } from "lucide-react";

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
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-raised)] rounded-[var(--radius-xl)] text-[var(--foreground)] text-sm font-medium placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] transition"
                    autoFocus
                />
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
