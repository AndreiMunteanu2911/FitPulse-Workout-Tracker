"use client";

export function useWeightLogs() {
  const fetchWeights = async () => {
    const res = await fetch("/api/weight-logs");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch weights");
    return data.weights;
  };

  const addWeight = async (log_date: string, weight: string) => {
    const res = await fetch("/api/weight-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log_date, weight }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add weight");
  };

  return { fetchWeights, addWeight };
}
