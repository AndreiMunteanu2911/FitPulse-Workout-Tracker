"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import ExerciseCard, { Exercise } from "@/components/ExerciseCard";
import supabase from "@/helper/supabaseClient";

const BATCH_SIZE = 20;

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const loaderRef = useRef<HTMLDivElement>(null);
    const isFetchingRef = useRef(false); // Prevent concurrent fetches

    // Fetch exercises batch
    const fetchExercises = async (currentPage: number) => {
        if (isFetchingRef.current) return; // Prevent duplicate calls

        isFetchingRef.current = true;
        setLoading(true);

        const { data, error } = await supabase
            .from("exercises")
            .select("*")
            .range(currentPage * BATCH_SIZE, (currentPage + 1) * BATCH_SIZE - 1);

        if (error) {
            console.error("Error fetching exercises:", error);
        } else {
            setExercises((prev) => {
                // Deduplicate to be safe
                const existingIds = new Set(prev.map(e => e.exercise_id));
                const newExercises = (data ?? []).filter(e => !existingIds.has(e.exercise_id));
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
        fetchExercises(page);
    }, [page]);

    // Infinite scroll observer
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

    return (
        <ProtectedWrapper>
            <div className="p-4">
                <h1 className="text-3xl font-bold mb-6">Exercises</h1>

                <div className="flex flex-col gap-3">
                    {exercises.map((exercise) => (
                        <ExerciseCard key={exercise.exercise_id} exercise={exercise} />
                    ))}
                </div>

                {loading && <div className="text-center mt-4">Loading more...</div>}
                <div ref={loaderRef} className="h-10" />
                {!hasMore && <div className="text-center mt-4">No more exercises.</div>}
            </div>
        </ProtectedWrapper>
    );
}