"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard from "@/components/ExerciseCard";
import type { Exercise } from "@/types";
import Skeleton from "react-loading-skeleton";
import { useExercises } from "@/hooks/useExercises";
import { Search, X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const loaderRef = useRef<HTMLDivElement>(null);
    const isFetchingRef = useRef(false);
    const { fetchExercises } = useExercises();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

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
                return [...prev, ...data.filter(e => !existingIds.has(e.exercise_id))];
            });
            setHasMore(result.hasMore);
        } catch (err) {
            console.error("Error fetching exercises:", err);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [fetchExercises]);

    useEffect(() => {
        setPage(0);
        setHasMore(true);
    }, [debouncedSearch]);

    useEffect(() => {
        loadExercises(page, debouncedSearch);
    }, [page, debouncedSearch, loadExercises]);

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
                <div className="page-header mb-5">
                    <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight mb-3">Exercises</h1>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[var(--surface)] rounded-[var(--radius-lg)] text-[var(--foreground)] text-sm font-medium placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)] transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exercises.map((exercise) => (
                        <ExerciseCard key={exercise.exercise_id} exercise={exercise} />
                    ))}
                </div>

                <div ref={loaderRef} className="h-10" />
                {loading && (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner size={8} />
                    </div>
                )}
                {!hasMore && exercises.length > 0 && (
                    <p className="text-center text-xs text-[var(--muted-foreground)] py-5">All exercises loaded</p>
                )}
            </div>
        </ProtectedWrapper>
    );
}
