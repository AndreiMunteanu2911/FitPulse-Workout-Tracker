"use client";

import { useCallback } from "react";
import { apiFetch } from "@/services/api/apiFetch";
import type { WeightLog } from "@/types";

export function useWeightLogs() {
  const fetchWeights = useCallback(async () => {
    const data = await apiFetch<{ weights: WeightLog[] }>("/api/weight-logs");
    return data.weights;
  }, []);

  const addWeight = useCallback(async (log_date: string, weight: string) => {
    await apiFetch("/api/weight-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log_date, weight }),
    });
  }, []);

  const deleteWeight = useCallback(async (id: string) => {
    await apiFetch(`/api/weight-logs?id=${id}`, {
      method: "DELETE",
    });
  }, []);

  return { fetchWeights, addWeight, deleteWeight };
}
