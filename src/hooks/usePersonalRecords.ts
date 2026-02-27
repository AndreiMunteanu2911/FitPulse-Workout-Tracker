"use client";

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  max_weight: number;
  max_reps: number;
  workout_date: string;
  created_at: string;
  updated_at: string;
  exercise?: {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
  };
}

export function usePersonalRecords() {
  const fetchPersonalRecords = async (): Promise<PersonalRecord[]> => {
    const res = await fetch("/api/personal-records");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch personal records");
    return data.records || [];
  };

  const addPersonalRecord = async (record: {
    exercise_id: string;
    max_weight: number;
    max_reps: number;
    workout_date: string;
  }): Promise<PersonalRecord> => {
    const res = await fetch("/api/personal-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add personal record");
    return data.record;
  };

  const updatePersonalRecord = async (record: {
    id: string;
    max_weight?: number;
    max_reps?: number;
    workout_date?: string;
  }): Promise<PersonalRecord> => {
    const res = await fetch("/api/personal-records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update personal record");
    return data.record;
  };

  const deletePersonalRecord = async (id: string): Promise<void> => {
    const res = await fetch(`/api/personal-records?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete personal record");
  };

  return {
    fetchPersonalRecords,
    addPersonalRecord,
    updatePersonalRecord,
    deletePersonalRecord,
  };
}
