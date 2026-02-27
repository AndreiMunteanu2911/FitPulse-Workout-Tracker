import { Workout, Exercise, Set, WeightLog, WorkoutStats, APIResponse } from "@/types";

const BASE_URL = "";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as APIResponse<T>).error || "Request failed");
  }
  return data as T;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(BASE_URL + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
  signup: async (email: string, password: string) => {
    const res = await fetch(BASE_URL + "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetch(BASE_URL + "/api/auth/logout", { method: "POST" });
    return handleResponse(res);
  },
  getSession: async () => {
    const res = await fetch(BASE_URL + "/api/auth/session");
    return handleResponse(res);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const res = await fetch(BASE_URL + "/api/dashboard");
    return handleResponse<{ stats: WorkoutStats }>(res);
  },
};

// Workout API
export const workoutApi = {
  getDraft: async () => {
    const res = await fetch(BASE_URL + "/api/workouts/draft");
    return handleResponse<{ workout: Workout | null }>(res);
  },
  create: async (name: string) => {
    const res = await fetch(BASE_URL + "/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ workout: Workout }>(res);
  },
  update: async (id: string, updates: { name?: string; status?: string }) => {
    const res = await fetch(BASE_URL + "/api/workouts/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(BASE_URL + "/api/workouts/" + id, { method: "DELETE" });
    return handleResponse(res);
  },
  getHistory: async () => {
    const res = await fetch(BASE_URL + "/api/workouts");
    return handleResponse<{ workouts: Workout[] }>(res);
  },
  getById: async (id: string) => {
    const res = await fetch(BASE_URL + "/api/workouts/" + id);
    return handleResponse<{ workout: Workout }>(res);
  },
};

// Exercise API
export const exerciseApi = {
  getAll: async (page: number, search: string) => {
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(BASE_URL + "/api/exercises?" + params);
    return handleResponse<{ exercises: Exercise[]; hasMore: boolean }>(res);
  },
  getById: async (id: string) => {
    const res = await fetch(BASE_URL + "/api/exercises/" + id);
    return handleResponse<{ exercise: Exercise }>(res);
  },
  search: async (query: string, limit = 10) => {
    const params = new URLSearchParams({ search: query, page: "0" });
    const res = await fetch(BASE_URL + "/api/exercises?" + params);
    const data = await handleResponse<{ exercises: Exercise[] }>(res);
    return data.exercises.slice(0, limit);
  },
};

// Set API
export const setApi = {
  create: async (workoutExerciseId: string, setNumber: number, reps: number, weight: number) => {
    const res = await fetch(BASE_URL + "/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_exercise_id: workoutExerciseId, set_number: setNumber, reps, weight }),
    });
    return handleResponse<{ set: Set }>(res);
  },
  update: async (id: string, updates: { reps?: number; weight?: number }) => {
    const res = await fetch(BASE_URL + "/api/sets/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(BASE_URL + "/api/sets/" + id, { method: "DELETE" });
    return handleResponse(res);
  },
};

// Weight Log API
export const weightLogApi = {
  getAll: async () => {
    const res = await fetch(BASE_URL + "/api/weight-logs");
    return handleResponse<{ weightLogs: WeightLog[] }>(res);
  },
  create: async (weight: number, logDate?: string) => {
    const res = await fetch(BASE_URL + "/api/weight-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, log_date: logDate }),
    });
    return handleResponse(res);
  },
};

// Workout Exercise API
export const workoutExerciseApi = {
  add: async (workoutId: string, exerciseId: string, orderIndex: number) => {
    const res = await fetch(BASE_URL + "/api/workouts/" + workoutId + "/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise_id: exerciseId, order_index: orderIndex }),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(BASE_URL + "/api/workout-exercises/" + id, { method: "DELETE" });
    return handleResponse(res);
  },
};


// Templates API
export const templatesApi = {
  getAll: async () => {
    const res = await fetch(BASE_URL + "/api/templates");
    return handleResponse<{ templates: import("@/types").WorkoutTemplate[] }>(res);
  },
  create: async (name: string, description?: string, exercises?: { exercise_id: string }[]) => {
    const res = await fetch(BASE_URL + "/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, exercises }),
    });
    return handleResponse<{ template: import("@/types").WorkoutTemplate }>(res);
  },
};

// Progress Photos API
export const progressPhotosApi = {
  getAll: async (bodyPart?: string) => {
    const params = new URLSearchParams();
    if (bodyPart) params.set("bodyPart", bodyPart);
    const res = await fetch(BASE_URL + "/api/progress-photos?" + params);
    return handleResponse<{ photos: import("@/types").ProgressPhoto[] }>(res);
  },
  create: async (photoUrl: string, logDate?: string, notes?: string, bodyPart?: string) => {
    const res = await fetch(BASE_URL + "/api/progress-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_url: photoUrl, log_date: logDate, notes, body_part: bodyPart }),
    });
    return handleResponse(res);
  },
};

// Personal Records API
export const personalRecordsApi = {
  getAll: async () => {
    const res = await fetch(BASE_URL + "/api/personal-records");
    return handleResponse<{ records: import("@/types").PersonalRecord[] }>(res);
  },
};

// User Exercises (Favorites) API
export const userExercisesApi = {
  getAll: async (favoritesOnly?: boolean) => {
    const params = new URLSearchParams();
    if (favoritesOnly) params.set("favorites", "true");
    const res = await fetch(BASE_URL + "/api/user-exercises?" + params);
    return handleResponse<{ userExercises: import("@/types").UserExercise[] }>(res);
  },
  toggleFavorite: async (exerciseId: string, isFavorite: boolean) => {
    const res = await fetch(BASE_URL + "/api/user-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise_id: exerciseId, is_favorite: isFavorite }),
    });
    return handleResponse(res);
  },
};