"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard from "@/components/ExerciseCard";
import type { Exercise } from "@/types";
import { useExercises } from "@/hooks/useExercises";
import { Search, X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";

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
            <div className="page-stack">
                <PageHeader
                    title="Exercises"
                    description="Browse the exercise library and find movements for your next workout."
                />
                <div className="toolbar">
                    <div className="relative w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input border-0 bg-[var(--surface-raised)] !pl-12 !pr-12 font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)] transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AnimatePresence initial={false} mode="popLayout">
                    {exercises.map((exercise) => (
                        <motion.div
                            layout
                            key={exercise.exercise_id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.985 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                            <ExerciseCard exercise={exercise} />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </motion.div>

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
