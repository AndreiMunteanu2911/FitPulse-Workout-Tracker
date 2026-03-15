"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WorkoutCalendarProps {
    workoutDates: string[]; // YYYY-MM-DD format
}

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function WorkoutCalendar({ workoutDates }: WorkoutCalendarProps) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const dateSet = new Set(workoutDates);
    const todayStr = today.toISOString().split("T")[0];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const goToPrev = () => {
        if (month === 0) { setMonth(11); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
    };

    const goToNext = () => {
        if (month === 11) { setMonth(0); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
    };

    // Build grid cells (null = empty padding)
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPrev}
                    aria-label="Previous month"
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-[var(--foreground)]">
                    {MONTH_NAMES[month]} {year}
                </span>
                <button
                    onClick={goToNext}
                    aria-label="Next month"
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day-name row */}
            <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, idx) => {
                    if (day === null) {
                        return <div key={`empty-${idx}`} />;
                    }
                    const mm = String(month + 1).padStart(2, "0");
                    const dd = String(day).padStart(2, "0");
                    const dateStr = `${year}-${mm}-${dd}`;
                    const hasWorkout = dateSet.has(dateStr);
                    const isToday = dateStr === todayStr;

                    return (
                        <div
                            key={dateStr}
                            className={`
                                flex items-center justify-center mx-auto w-8 h-8 rounded-full text-xs font-medium select-none
                                ${hasWorkout
                                    ? "bg-[var(--primary-500)] text-white font-bold"
                                    : isToday
                                        ? "border-2 border-[var(--primary-500)] text-[var(--primary-600)] dark:text-[var(--primary-400)]"
                                        : "text-[var(--foreground)]"
                                }
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <span className="w-3 h-3 rounded-full bg-[var(--primary-500)] inline-block" />
                    Workout day
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <span className="w-3 h-3 rounded-full border-2 border-[var(--primary-500)] inline-block" />
                    Today
                </span>
            </div>
        </div>
    );
}
