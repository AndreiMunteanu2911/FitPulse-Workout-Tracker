"use client";

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
  const fetchTemplates = async (): Promise<WorkoutTemplate[]> => {
    const res = await fetch("/api/templates");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch templates");
    return data.templates || [];
  };

  const fetchTemplate = async (templateId: string): Promise<WorkoutTemplate> => {
    const res = await fetch(`/api/templates?templateId=${encodeURIComponent(templateId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch template");
    return data.template;
  };

  const createTemplate = async (data: {
    name: string;
    description?: string;
    exercises?: { exercise_id: string }[];
  }): Promise<WorkoutTemplate> => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to create template");
    return resData.template;
  };

  const updateTemplate = async (data: {
    id: string;
    name?: string;
    description?: string;
    exercises?: { exercise_id: string }[];
  }): Promise<WorkoutTemplate> => {
    const res = await fetch("/api/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to update template");
    return resData.template;
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    const res = await fetch(`/api/templates?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete template");
  };

  return {
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
