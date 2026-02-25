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
    const loaderRef = useRef<HTMLDivElement>(null);
    const isFetchingRef = useRef(false);
    const prevSearchQueryRef = useRef<string>("");
    const { fetchExercises } = useExercises();

    const loadExercises = useCallback(async (currentPage: number) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setLoading(true);
        try {
            const result = await fetchExercises(currentPage, searchQuery);
            const data = result.exercises as Exercise[];
            setExercises((prev) => {
                const existingIds = new Set(prev.map(e => e.exercise_id));
                const newExercises = data.filter(e => !existingIds.has(e.exercise_id));
                return [...prev, ...newExercises];
            });
            if (data.length < BATCH_SIZE) setHasMore(false);
        } catch (err) {
            console.error("Error fetching exercises:", err);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [searchQuery, fetchExercises]);

    useEffect(() => {
        const isSearchMode = searchQuery.trim() !== "";
        const wasSearchMode = prevSearchQueryRef.current.trim() !== "";
        if (isSearchMode !== wasSearchMode) {
            setPage(0);
            setExercises([]);
            setHasMore(true);
        }
        loadExercises(page);
        prevSearchQueryRef.current = searchQuery;
    }, [page, searchQuery, loadExercises]);

    useEffect(() => {
        const currentLoader = loaderRef.current;
        if (!currentLoader || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingRef.current) {
                    setPage((prev) => prev + 1);
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(currentLoader);

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
            observer.disconnect();
        };
    }, [hasMore, loading]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPage(0);
        setExercises([]);
        setHasMore(true);
    };

    return (
        <ProtectedWrapper>
            <div className="p-4 md:p-8 w-full">
                <div className="sticky top-0 py-4 bg-white/95 backdrop-blur-sm z-10 text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6">
                    <span>Exercises</span>
                    <input
                        type="text"
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="border rounded-md px-3 py-1 text-base md:text-xl w-full sm:w-auto"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {exercises.map((exercise) => (
                        <ExerciseCard key={exercise.exercise_id} exercise={exercise} />
                    ))}
                </div>

                <div ref={loaderRef} className="h-10" />
                {loading && <div className="flex justify-center items-center py-4"><LoadingSpinner size={8} /></div>}
                {!hasMore && <div className="text-center mt-4">No more exercises.</div>}
            </div>
        </ProtectedWrapper>
    );
}