"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
    const [direction, setDirection] = useState(1);

    const dateSet = new Set(workoutDates);
    const todayStr = today.toISOString().split("T")[0];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const goToPrev = () => {
        setDirection(-1);
        if (month === 0) { setMonth(11); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
    };

    const goToNext = () => {
        setDirection(1);
        if (month === 11) { setMonth(0); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
    };

    // Build grid cells (null = empty padding)
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="surface-muted p-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPrev}
                    aria-label="Previous month"
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-[var(--foreground)]">
                    {MONTH_NAMES[month]} {year}
                </span>
                <button
                    onClick={goToNext}
                    aria-label="Next month"
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, x: direction * 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -12 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                >
                    <div className="mb-1 grid grid-cols-7">
                        {DAY_NAMES.map((dayName) => (
                            <div key={dayName} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                                {dayName}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, idx) => {
                            if (day === null) return <div key={`empty-${idx}`} />;
                            const mm = String(month + 1).padStart(2, "0");
                            const dd = String(day).padStart(2, "0");
                            const dateStr = `${year}-${mm}-${dd}`;
                            const hasWorkout = dateSet.has(dateStr);
                            const isToday = dateStr === todayStr;
                            return (
                                <div key={dateStr} className="mx-auto flex size-8 select-none items-center justify-center">
                                    <div className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                                        hasWorkout
                                            ? "bg-[var(--primary-500)] font-bold text-white shadow-sm"
                                            : isToday
                                                ? "border-2 border-[var(--primary-500)] font-semibold text-[var(--primary-600)] dark:text-[var(--primary-400)]"
                                                : "text-[var(--foreground)]"
                                    }`}>
                                        {day}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 pt-3">
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
