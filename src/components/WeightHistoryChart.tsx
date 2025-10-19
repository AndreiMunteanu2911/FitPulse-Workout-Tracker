import React from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";
import WeightLogCard from "@/components/WeightLogCard";

interface WeightHistoryChartProps {
    weights: { log_date: string; weight: number }[];
    loading: boolean;
}

const WeightHistoryChart: React.FC<WeightHistoryChartProps> = ({ weights, loading }) => {
    const chartData = weights.map(w => ({ ...w, log_date: new Date(w.log_date).getTime() }));

    return (
        <div className="mb-4 mt-2 sm:mb-6 sm:mt-4">
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <LoadingSpinner size={10} />
                </div>
            ) : chartData.length === 0 ? (
                <p>No weight logs yet.</p>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] overflow-x-hidden">
                        <LineChart data={chartData} style={{ overflow: 'visible' }} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
                            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="log_date"
                                scale="time"
                                type="number"
                                domain={['auto', 'auto']}
                                tickFormatter={(dateStrOrNum) => {
                                    const d = new Date(dateStrOrNum);
                                    if (isNaN(d.getTime())) return '';
                                    const day = String(d.getDate()).padStart(2, '0');
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    if (window.innerWidth < 640) return `${month}/${day}`;
                                    const year = d.getFullYear();
                                    return `${day}/${month}/${year}`;
                                }}
                                stroke="#334155"
                                tick={{ fill: '#334155', fontSize: 10 }}
                                axisLine={{ stroke: '#cbd5e1' }}
                                tickLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis
                                dataKey="weight"
                                stroke="#334155"
                                tick={{ fill: '#334155', fontSize: 10 }}
                                axisLine={{ stroke: '#cbd5e1' }}
                                tickLine={{ stroke: '#cbd5e1' }}
                            />
                            <Tooltip
                                wrapperStyle={{ display: 'none' }}
                            />
                            <Line
                                type="linear"
                                dataKey="weight"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                dot={{ r: 5, stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 7, stroke: '#0ea5e9', strokeWidth: 3, fill: '#fff' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 rounded-xs overflow-hidden bg-white gap-y-2 max-h-96 overflow-y-auto mx-auto w-full sm:max-w-lg">
                        {weights.length === 0 ? (
                            <div className="px-4 py-4 text-center text-gray-700">No logs to display.</div>
                        ) : (
                            weights.map((log, idx) => (
                                <WeightLogCard key={log.log_date + '-' + log.weight + '-' + idx} date={log.log_date} weight={log.weight} />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default WeightHistoryChart;