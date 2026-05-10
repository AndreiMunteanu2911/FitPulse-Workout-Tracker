"use client";

import { useCallback } from "react";
import { apiFetch } from "@/services/api/apiFetch";

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  template_exercises?: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  order_index: number;
  created_at: string;
  exercise?: {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
  };
}

export function useWorkoutTemplates() {
  const fetchTemplates = useCallback(async (): Promise<WorkoutTemplate[]> => {
    const data = await apiFetch<{ templates?: WorkoutTemplate[] }>("/api/templates");
    return data.templates || [];
  }, []);

  const fetchTemplate = useCallback(async (templateId: string): Promise<WorkoutTemplate> => {
    const data = await apiFetch<{ template: WorkoutTemplate }>(`/api/templates?templateId=${encodeURIComponent(templateId)}`);
    return data.template;
  }, []);

  const createTemplate = useCallback(async (data: {
    name: string;
    description?: string;
    exercises?: { exercise_id: string }[];
  }): Promise<WorkoutTemplate> => {
    const resData = await apiFetch<{ template: WorkoutTemplate }>("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return resData.template;
  }, []);

  const updateTemplate = useCallback(async (data: {
    id: string;
    name?: string;
    description?: string;
    exercises?: { exercise_id: string }[];
  }): Promise<WorkoutTemplate> => {
    const resData = await apiFetch<{ template: WorkoutTemplate }>("/api/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return resData.template;
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/templates?id=${id}`, {
      method: "DELETE",
    });
  }, []);

  return {
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
