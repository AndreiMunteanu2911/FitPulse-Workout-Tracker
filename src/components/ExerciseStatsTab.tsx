"use client";

import { useEffect, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { BarChart3, CalendarDays, Repeat2, Trophy, Weight, Zap } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ExerciseStat {
    workout_date: string;
    max_weight: number;
    max_reps: number;
    volume: number;
}

interface ExerciseStatsTabProps {
    exerciseId: string;
}

interface StatsChartProps {
    data: (ExerciseStat & { date_ms: number })[];
    dataKey: keyof ExerciseStat;
    label: string;
    color: string;
    unit: string;
}

const TICK_FORMATTER = (value: number) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
};

function StatsChart({ data, dataKey, label, color, unit }: StatsChartProps) {
    return (
        <section className="card p-4 sm:p-6">
            <h3 className="eyebrow !mb-4">{label}</h3>
            <ResponsiveContainer width="100%" height={220}>
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
                        allowDuplicatedCategory={false}
                    />
                    <YAxis
                        dataKey={dataKey as string}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={false}
                        width={42}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: 12,
                            color: "var(--foreground)",
                        }}
                        labelFormatter={(value) => new Date(value as number).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
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
        </section>
    );
}

export default function ExerciseStatsTab({ exerciseId }: ExerciseStatsTabProps) {
    const [stats, setStats] = useState<ExerciseStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/exercises/${exerciseId}/stats`);
                const data = await response.json();
                if (response.ok) setStats(data.history || []);
            } catch {
                // The empty state communicates an unavailable or empty history.
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [exerciseId]);

    if (loading) {
        return (
            <div className="flex min-h-[18rem] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (stats.length === 0) {
        return (
            <div className="rounded-[var(--radius-xl)] bg-[var(--surface)] px-6 py-14 text-center shadow-[var(--shadow-xs)]">
                <span className="icon-tile mx-auto mb-4 !size-14">
                    <BarChart3 className="size-6" />
                </span>
                <h2 className="text-lg font-bold text-[var(--foreground)]">No progress data yet</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Log this exercise in a workout to build your performance history.
                </p>
            </div>
        );
    }

    const chartData = stats.map((stat) => ({
        ...stat,
        date_ms: new Date(stat.workout_date).getTime(),
    }));
    const latest = stats[stats.length - 1];
    const allTimeWeight = Math.max(...stats.map((stat) => stat.max_weight));
    const allTimeReps = Math.max(...stats.map((stat) => stat.max_reps));
    const allTimeVolume = Math.max(...stats.map((stat) => stat.volume));
    const bestWeightDate = stats.find((stat) => stat.max_weight === allTimeWeight)?.workout_date;
    const bestRepsDate = stats.find((stat) => stat.max_reps === allTimeReps)?.workout_date;
    const bestVolumeDate = stats.find((stat) => stat.volume === allTimeVolume)?.workout_date;

    const formatDate = (date?: string) => date
        ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "";

    const metrics = [
        { label: "Best weight", value: allTimeWeight, unit: "kg", date: bestWeightDate, icon: Weight },
        { label: "Best reps", value: allTimeReps, unit: "reps", date: bestRepsDate, icon: Repeat2 },
        { label: "Best volume", value: allTimeVolume, unit: "kg x reps", date: bestVolumeDate, icon: Zap },
    ];

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div key={metric.label} className="card relative overflow-hidden p-4 sm:p-5">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)]" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="eyebrow !mb-2">{metric.label}</p>
                                    <p className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                                        {metric.value}{" "}
                                        <span className="text-xs font-semibold text-[var(--muted-foreground)]">{metric.unit}</span>
                                    </p>
                                </div>
                                <span className="icon-tile !size-9"><Icon className="size-4" /></span>
                            </div>
                            {metric.date && (
                                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                                    <CalendarDays className="size-3.5" />
                                    {formatDate(metric.date)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-center gap-3">
                    <span className="icon-tile !size-10"><Trophy className="size-4" /></span>
                    <div>
                        <p className="eyebrow !mb-0.5">Latest session</p>
                        <p className="text-sm font-semibold text-[var(--foreground)]">Your most recent logged performance</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:flex">
                    <span className="badge badge-soft justify-center">{latest.max_weight} kg</span>
                    <span className="badge badge-soft justify-center">{latest.max_reps} reps</span>
                    <span className="badge badge-soft justify-center">{latest.volume} vol</span>
                </div>
            </div>

            <StatsChart
                data={chartData}
                dataKey="max_weight"
                label="Max weight (kg)"
                color="var(--primary-500)"
                unit="kg"
            />
            <StatsChart
                data={chartData}
                dataKey="volume"
                label="Volume (kg x reps)"
                color="var(--color-success)"
                unit="kg x reps"
            />
            <StatsChart
                data={chartData}
                dataKey="max_reps"
                label="Max reps"
                color="var(--color-warning)"
                unit="reps"
            />
        </div>
    );
}
