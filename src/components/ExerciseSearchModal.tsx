import Button from "./Button";
import ExerciseCard from "./ExerciseCard";
import Skeleton from "react-loading-skeleton";
import ModalWrapper from "./ModalWrapper";
import type { Exercise } from "@/types";
import { Search, Plus } from "lucide-react";

interface ExerciseSearchModalProps {
    isOpen: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Exercise[];
    isSearching: boolean;
    onClose: () => void;
    onSelectExercise: (exercise: Exercise) => void;
    onAddCustomExercise?: () => void;
}

export default function ExerciseSearchModal({
    isOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    onClose,
    onSelectExercise,
    onAddCustomExercise,
}: ExerciseSearchModalProps) {
    const showEmptyState = searchResults.length === 0 && !isSearching && searchQuery.trim() !== "";
    const showCreateButton = showEmptyState && onAddCustomExercise;

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-md sm:max-w-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)]">Search Exercises</h3>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)] transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[var(--surface)] rounded-[var(--radius-md)] text-[var(--foreground)] text-sm font-medium placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] transition"
                    autoFocus
                />
            </div>
            
            {isSearching && (
                <div className="space-y-2 my-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton circle width={40} height={40} />
                            <div className="flex-1">
                                <Skeleton width={120} className="mb-1" />
                                <Skeleton width={80} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="space-y-2 overflow-y-auto max-h-[60vh] -mx-2 px-2">
                {showEmptyState && !showCreateButton && (
                    <div className="text-center text-[var(--muted-foreground)] py-8">
                        No exercises found for &quot;{searchQuery}&quot;
                    </div>
                )}
                {showCreateButton && (
                    <div className="text-center py-4">
                        <p className="text-sm text-[var(--muted-foreground)] mb-3">
                            No exercises found for &quot;{searchQuery}&quot;
                        </p>
                        <Button 
                            onClick={onAddCustomExercise} 
                            variant="primary"
                            className="mx-auto"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create Custom Exercise
                        </Button>
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
