"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard, { Exercise } from "@/components/ExerciseCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useExercises } from "@/hooks/useExercises";

const BATCH_SIZE = 20;

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    // Add a state for the "debounced" version of the search
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const loaderRef = useRef<HTMLDivElement>(null);
    const isFetchingRef = useRef(false);
    const { fetchExercises } = useExercises();

    // 1. Handle Debouncing logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(handler);
    }, [searchQuery]);

    // 2. Fetching Logic
    const loadExercises = useCallback(async (currentPage: number, query: string) => {
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);

        try {
            const result = await fetchExercises(currentPage, query);
            const data = result.exercises as Exercise[];

            setExercises((prev) => {
                if (currentPage === 0) return data;
                const existingIds = new Set(prev.map(e => e.exercise_id));
                const newExercises = data.filter(e => !existingIds.has(e.exercise_id));
                return [...prev, ...newExercises];
            });

            setHasMore(data.length === BATCH_SIZE);
        } catch (err) {
            console.error("Error fetching exercises:", err);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [fetchExercises]);

    // 3. Reset when search changes
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        // Note: setting page to 0 will trigger the effect below
    }, [debouncedSearch]);

    // 4. Trigger fetch when page or debounced search changes
    useEffect(() => {
        loadExercises(page, debouncedSearch);
    }, [page, debouncedSearch, loadExercises]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // ... IntersectionObserver code for infinite scroll (unchanged)
    useEffect(() => {
        const currentLoader = loaderRef.current;
        if (!currentLoader || !hasMore || loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingRef.current) {
                    setPage((prev) => prev + 1);
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(currentLoader);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    return (
        <ProtectedWrapper>
            <div className="w-full">
                <div className="sticky top-0 py-4 z-10 text-2xl sm:text-3xl font-semibold text-[var(--foreground)] mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 bg-[var(--surface)]">
                    <span>Exercises</span>
                    <div className="relative w-full sm:w-auto flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full px-3 py-2 pl-8 text-[var(--foreground)] bg-[var(--surface)] border-b-2 border-[var(--border)] placeholder-[var(--muted-foreground)] focus:border-[var(--primary-500)] focus:outline-none rounded-none transition-colors text-base"
                        />
                        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {exercises.map((exercise) => (
                        <ExerciseCard key={exercise.exercise_id} exercise={exercise} />
                    ))}
                </div>

                <div ref={loaderRef} className="h-10" />
                {loading && <div className="flex justify-center items-center py-4"><LoadingSpinner size={8} /></div>}
                {!hasMore && exercises.length > 0 && <div className="text-center mt-4 text-gray-500">No more exercises.</div>}
            </div>
        </ProtectedWrapper>
    );
}