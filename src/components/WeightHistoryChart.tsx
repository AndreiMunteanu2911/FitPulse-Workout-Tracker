import React, { useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";
import WeightLogCard from "@/components/WeightLogCard";
import { AnimatePresence, motion } from "framer-motion";

interface WeightHistoryChartProps {
    weights: { log_date: string; weight: number; id?: string }[];
    loading: boolean;
    onDelete?: (id: string) => void;
}

type WeightRange = "30d" | "90d" | "1y" | "all";

const RANGE_OPTIONS: Array<{ label: string; value: WeightRange; days?: number }> = [
    { label: "30D", value: "30d", days: 30 },
    { label: "90D", value: "90d", days: 90 },
    { label: "1Y", value: "1y", days: 365 },
    { label: "All", value: "all" },
];

const WeightHistoryChart: React.FC<WeightHistoryChartProps> = ({ weights, loading, onDelete }) => {
    const [range, setRange] = useState<WeightRange>("90d");
    const sortedWeights = useMemo(
        () => [...weights].sort((a, b) => a.log_date.localeCompare(b.log_date)),
        [weights],
    );
    const rangeBounds = useMemo<[number, number] | undefined>(() => {
        if (sortedWeights.length === 0) return undefined;
        const latestTime = Math.max(...sortedWeights.map((item) => new Date(item.log_date).getTime()));
        const option = RANGE_OPTIONS.find((item) => item.value === range);
        if (!option?.days) {
            const earliestTime = Math.min(...sortedWeights.map((item) => new Date(item.log_date).getTime()));
            return [earliestTime, latestTime];
        }
        return [latestTime - option.days * 24 * 60 * 60 * 1000, latestTime];
    }, [range, sortedWeights]);
    const visibleWeights = useMemo(() => {
        if (!rangeBounds) return [];
        const [rangeStart] = rangeBounds;
        return sortedWeights.filter((item) => new Date(item.log_date).getTime() >= rangeStart);
    }, [rangeBounds, sortedWeights]);
    const chartWeights = useMemo(() => {
        const option = RANGE_OPTIONS.find((item) => item.value === range);
        if (!rangeBounds || !option?.days) return visibleWeights;
        const [rangeStart] = rangeBounds;
        const previous = [...sortedWeights]
            .reverse()
            .find((item) => new Date(item.log_date).getTime() < rangeStart);
        if (!previous) return visibleWeights;
        return [previous, ...visibleWeights];
    }, [range, rangeBounds, sortedWeights, visibleWeights]);
    const xDomain = rangeBounds;
    const clippedChartData = useMemo(() => {
        if (!rangeBounds || chartWeights.length === 0) return [];
        const [rangeStart, rangeEnd] = rangeBounds;
        const firstInRange = chartWeights.find((item) => new Date(item.log_date).getTime() >= rangeStart);
        const carryIn = chartWeights.find((item) => new Date(item.log_date).getTime() < rangeStart);
        if (!carryIn || !firstInRange) return chartWeights;

        const carryTime = new Date(carryIn.log_date).getTime();
        const firstTime = new Date(firstInRange.log_date).getTime();
        if (firstTime <= rangeStart || carryTime >= rangeStart) return chartWeights;

        const ratio = (rangeStart - carryTime) / (firstTime - carryTime);
        const interpolatedWeight = carryIn.weight + ((firstInRange.weight - carryIn.weight) * ratio);
        return [
            {
                ...carryIn,
                id: `${carryIn.id ?? carryIn.log_date}-range-start`,
                log_date: new Date(rangeStart).toISOString(),
                weight: Number(interpolatedWeight.toFixed(2)),
            },
            ...chartWeights.filter((item) => new Date(item.log_date).getTime() >= rangeStart && new Date(item.log_date).getTime() <= rangeEnd),
        ];
    }, [chartWeights, rangeBounds]);

    // Format dates as readable strings for categorical XAxis (avoids Recharts time-scale key collision)
    const chartData = clippedChartData.map((w, i) => ({
        ...w,
        timestamp: new Date(w.log_date).getTime(),
        dateStr: new Date(w.log_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        // Ensure unique key for each point
        chartKey: `${w.log_date}-${i}`,
    }));
    const yDomain = useMemo<[number, number]>(() => {
        const weightsForDomain = visibleWeights.length > 0 ? visibleWeights : sortedWeights;
        if (weightsForDomain.length === 0) return [0, 100];

        const min = Math.min(...weightsForDomain.map((item) => item.weight));
        const max = Math.max(...weightsForDomain.map((item) => item.weight));
        const spread = Math.max(max - min, 4);
        const padding = Math.max(spread * 0.35, 2);
        const lower = Math.max(0, Math.floor(min - padding));
        const upper = Math.ceil(max + padding);
        return lower === upper ? [Math.max(0, lower - 2), upper + 2] : [lower, upper];
    }, [sortedWeights, visibleWeights]);

    return (
        <div className="w-full">
            {loading ? (
                <div className="flex min-h-[16rem] items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : chartData.length === 0 ? (
                <p className="text-center text-[var(--muted-foreground)] py-8">No weight logs yet.</p>
            ) : (
                <>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                            Showing {visibleWeights.length} of {weights.length}
                        </p>
                        <div className="flex rounded-[var(--radius-sm)] bg-[var(--surface)] p-1">
                            {RANGE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRange(option.value)}
                                    className={`h-8 min-w-10 rounded-[var(--radius-sm)] px-2 text-xs font-bold transition-colors ${
                                        range === option.value
                                            ? "bg-[var(--primary-500)] text-white"
                                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ left: 0, right: 10, top: 8, bottom: 8 }}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                                <XAxis
                                    dataKey="timestamp"
                                    type="number"
                                    domain={xDomain}
                                    scale="time"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                    axisLine={{ stroke: 'var(--border)' }}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    dataKey="weight"
                                    domain={yDomain}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                    axisLine={{ stroke: 'var(--border)' }}
                                    tickLine={false}
                                    width={40}
                                />
                                <Tooltip wrapperStyle={{ display: 'none' }} />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="var(--primary-500)"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, stroke: 'var(--primary-500)', strokeWidth: 2, fill: 'var(--surface)' }}
                                    activeDot={{ r: 6, stroke: 'var(--primary-500)', strokeWidth: 2, fill: 'var(--surface)' }}
                                    animationDuration={180}
                                    animationEasing="ease-out"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <motion.div layout className="mt-4 max-h-72 overflow-y-auto rounded-[var(--radius-sm)] bg-[var(--surface-raised)]">
                        <AnimatePresence initial={false} mode="popLayout">
                        {sortedWeights.slice().reverse().map((log, idx) => (
                            <motion.div
                                layout
                                key={log.id || `${log.log_date}-${log.weight}-${idx}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            >
                                <WeightLogCard date={log.log_date} weight={log.weight} id={log.id} onDelete={onDelete} />
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default WeightHistoryChart;
