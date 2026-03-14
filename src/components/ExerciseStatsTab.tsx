"use client";

import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BarChart2 } from "lucide-react";

interface ExerciseStat {
    workout_date: string;
    max_weight: number;
    max_reps: number;
    volume: number;
}

interface ExerciseStatsTabProps {
    exerciseId: string;
}

const TICK_FORMATTER = (val: number) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

function StatsChart({
    data,
    dataKey,
    label,
    color,
    unit,
}: {
    data: (ExerciseStat & { date_ms: number })[];
    dataKey: keyof ExerciseStat;
    label: string;
    color: string;
    unit: string;
}) {
    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                {label}
            </h3>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ left: 0, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                    <XAxis
                        dataKey="date_ms"
                        scale="time"
                        type="number"
                        domain={["auto", "auto"]}
                        tickFormatter={TICK_FORMATTER}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={false}
                    />
                    <YAxis
                        dataKey={dataKey as string}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={false}
                        width={42}
                        tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: 12,
                            color: "var(--foreground)",
                        }}
                        labelFormatter={(val) => {
                            const d = new Date(val as number);
                            return d.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            });
                        }}
                        formatter={(value) => [`${value} ${unit}`, label]}
                    />
                    <Line
                        type="monotone"
                        dataKey={dataKey as string}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ r: 4, stroke: color, strokeWidth: 2, fill: "var(--surface)" }}
                        activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "var(--surface)" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function ExerciseStatsTab({ exerciseId }: ExerciseStatsTabProps) {
    const [stats, setStats] = useState<ExerciseStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/exercises/${exerciseId}/stats`);
                const data = await res.json();
                if (res.ok) setStats(data.history || []);
            } catch {
                // silently fail — empty state shown
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [exerciseId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <LoadingSpinner size={8} />
            </div>
        );
    }

    if (stats.length === 0) {
        return (
            <div className="text-center py-14 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                    <BarChart2 className="w-7 h-7 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                    No workout data yet. Log this exercise to see your progress!
                </p>
            </div>
        );
    }

    const chartData = stats.map((s) => ({
        ...s,
        date_ms: new Date(s.workout_date).getTime(),
    }));

    // Summary cards
    const latestWeight = stats[stats.length - 1]?.max_weight ?? 0;
    const latestVolume = stats[stats.length - 1]?.volume ?? 0;
    const latestReps = stats[stats.length - 1]?.max_reps ?? 0;
    const allTimeWeight = Math.max(...stats.map((s) => s.max_weight));
    const allTimeReps = Math.max(...stats.map((s) => s.max_reps));
    const allTimeVolume = Math.max(...stats.map((s) => s.volume));

    const bestWeightDate = stats.find((s) => s.max_weight === allTimeWeight)?.workout_date;
    const bestRepsDate = stats.find((s) => s.max_reps === allTimeReps)?.workout_date;
    const bestVolumeDate = stats.find((s) => s.volume === allTimeVolume)?.workout_date;

    const fmtShortDate = (d?: string) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">
                        Best Weight
                    </p>
                    <p className="text-xl font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-500)] leading-none">
                        {allTimeWeight}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">kg</p>
                    {bestWeightDate && (
                        <p className="text-[9px] text-[var(--muted-foreground)] mt-1 leading-none">{fmtShortDate(bestWeightDate)}</p>
                    )}
                </div>
                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">
                        Best Reps
                    </p>
                    <p className="text-xl font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-500)] leading-none">
                        {allTimeReps}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">reps</p>
                    {bestRepsDate && (
                        <p className="text-[9px] text-[var(--muted-foreground)] mt-1 leading-none">{fmtShortDate(bestRepsDate)}</p>
                    )}
                </div>
                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">
                        Best Volume
                    </p>
                    <p className="text-xl font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-500)] leading-none">
                        {allTimeVolume}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">kg·reps</p>
                    {bestVolumeDate && (
                        <p className="text-[9px] text-[var(--muted-foreground)] mt-1 leading-none">{fmtShortDate(bestVolumeDate)}</p>
                    )}
                </div>
            </div>

            {/* Last session summary */}
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] px-4 py-3 flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--muted-foreground)] text-xs">Last session</span>
                <div className="flex gap-4">
                    <span className="font-semibold text-[var(--foreground)]">{latestWeight} kg</span>
                    <span className="font-semibold text-[var(--foreground)]">{latestReps} reps</span>
                    <span className="font-semibold text-[var(--foreground)]">{latestVolume} vol</span>
                </div>
            </div>

            {/* Charts */}
            <StatsChart
                data={chartData}
                dataKey="max_weight"
                label="Max Weight (kg)"
                color="var(--primary-500)"
                unit="kg"
            />
            <StatsChart
                data={chartData}
                dataKey="volume"
                label="Volume (kg·reps)"
                color="var(--color-success)"
                unit="kg·reps"
            />
            <StatsChart
                data={chartData}
                dataKey="max_reps"
                label="Max Reps"
                color="var(--color-warning)"
                unit="reps"
            />
        </div>
    );
}
