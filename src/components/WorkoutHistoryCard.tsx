import type { Workout } from "@/types";

interface WorkoutHistoryCardProps {
    workout: Workout;
}

export default function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const calculateTotalVolume = (w: Workout) => {
        let totalVolume = 0;
        w.workout_exercises.forEach((we) => {
            we.sets.forEach((set) => {
                totalVolume += set.reps * set.weight;
            });
        });
        if (totalVolume >= 1000) return (totalVolume / 1000).toFixed(1) + "k";
        return totalVolume.toFixed(0);
    };

    const calculateTotalSets = (w: Workout) => {
        return w.workout_exercises.reduce((total, we) => total + we.sets.length, 0);
    };

    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className="flex min-h-[5rem]">
                {/* Left accent strip */}
                <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-[var(--primary-500)] to-[var(--primary-700)]" />

                <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] leading-snug">{workout.name}</h3>
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>

                    <p className="text-xs text-[var(--muted-foreground)] mb-3">{formatDate(workout.workout_date)}</p>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                            {workout.workout_exercises.length} exercises
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
                            {calculateTotalSets(workout)} sets
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            {calculateTotalVolume(workout)} kg
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
