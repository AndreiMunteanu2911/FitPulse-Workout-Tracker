"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard, { Exercise } from "@/components/ExerciseCard";
import supabase from "@/helper/supabaseClient";
import LoadingSpinner from "@/components/LoadingSpinner";

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

    const fetchExercises = async (currentPage: number) => {
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);

        let data = [];
        let error = null;
        if (searchQuery.trim() === "") {
            const res = await supabase
                .from("exercises")
                .select("*")
                .range(currentPage * BATCH_SIZE, (currentPage + 1) * BATCH_SIZE - 1);
            data = res.data ?? [];
            error = res.error;
        } else {
            const words = searchQuery.trim().toLowerCase().split(/\s+/);
            const res = await supabase
                .from("exercises")
                .select("*");
            data = res.data ?? [];
            error = res.error;
            data = data.filter(e => {
                const name = (e.name || "").toLowerCase();
                return words.every(word => name.includes(word));
            });
            data = data.slice(currentPage * BATCH_SIZE, (currentPage + 1) * BATCH_SIZE);
        }

        if (error) {
            console.error("Error fetching exercises:", error);
        } else {
            const processedData = (data ?? []).map(e => ({
                ...e,
                name: e.name ? e.name.charAt(0).toUpperCase() + e.name.slice(1) : e.name
            }));
            setExercises((prev) => {
                const existingIds = new Set(prev.map(e => e.exercise_id));
                const newExercises = processedData.filter(e => !existingIds.has(e.exercise_id));
                return [...prev, ...newExercises];
            });

            if (!data || data.length < BATCH_SIZE) {
                setHasMore(false);
            }
        }

        setLoading(false);
        isFetchingRef.current = false;
    };

    useEffect(() => {
        const isSearchMode = searchQuery.trim() !== "";
        const wasSearchMode = prevSearchQueryRef.current.trim() !== "";
        if (isSearchMode !== wasSearchMode) {
            setPage(0);
            setExercises([]);
            setHasMore(true);
        }
        fetchExercises(page);
        prevSearchQueryRef.current = searchQuery;
    }, [page, searchQuery]);

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