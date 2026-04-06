import React from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Skeleton from "react-loading-skeleton";
import WeightLogCard from "@/components/WeightLogCard";

interface WeightHistoryChartProps {
    weights: { log_date: string; weight: number; id?: string }[];
    loading: boolean;
    onDelete?: (id: string) => void;
}

const WeightHistoryChart: React.FC<WeightHistoryChartProps> = ({ weights, loading, onDelete }) => {
    const chartData = weights.map(w => ({ ...w, log_date: new Date(w.log_date).getTime() }));

    return (
        <div className="w-full">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton height={220} className="rounded-xl" />
                    <div className="bg-[var(--surface-raised)] rounded-lg overflow-hidden max-h-72 p-4 space-y-3">
                        <Skeleton height={36} />
                        <Skeleton height={36} />
                        <Skeleton height={36} />
                    </div>
                </div>
            ) : chartData.length === 0 ? (
                <p className="text-center text-[var(--muted-foreground)] py-8">No weight logs yet.</p>
            ) : (
                <>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ left: 0, right: 10, top: 8, bottom: 8 }}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                                <XAxis
                                    dataKey="log_date"
                                    scale="time"
                                    type="number"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        if (isNaN(d.getTime())) return '';
                                        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                                    }}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                    axisLine={{ stroke: 'var(--border)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="weight"
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
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 bg-[var(--surface-raised)] rounded-[var(--radius-lg)] overflow-hidden max-h-72 overflow-y-auto">
                        {weights.map((log, idx) => (
                            <WeightLogCard
                                key={log.id || `${log.log_date}-${log.weight}-${idx}`}
                                date={log.log_date}
                                weight={log.weight}
                                id={log.id}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default WeightHistoryChart;
