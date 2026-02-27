"use client";

export interface UserExercise {
  id: string;
  user_id: string;
  exercise_id: string;
  is_favorite: boolean;
  created_at: string;
  exercise?: {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
    secondary_muscles?: string[];
    instructions?: string[];
  };
}

export function useUserExercises() {
  const fetchUserExercises = async (favoritesOnly?: boolean): Promise<UserExercise[]> => {
    const url = favoritesOnly ? "/api/user-exercises?favorites=true" : "/api/user-exercises";
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch user exercises");
    return data.userExercises || [];
  };

  const addUserExercise = async (data: {
    exercise_id: string;
    is_favorite?: boolean;
  }): Promise<UserExercise> => {
    const res = await fetch("/api/user-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to add user exercise");
    return resData.userExercise;
  };

  const updateUserExercise = async (data: {
    id: string;
    exercise_id?: string;
    is_favorite?: boolean;
  }): Promise<UserExercise> => {
    const res = await fetch("/api/user-exercises", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to update user exercise");
    return resData.userExercise;
  };

  const deleteUserExercise = async (id: string): Promise<void> => {
    const res = await fetch(`/api/user-exercises?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete user exercise");
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean): Promise<UserExercise> => {
    return updateUserExercise({ id, is_favorite: !currentFavorite });
  };

  return {
    fetchUserExercises,
    addUserExercise,
    updateUserExercise,
    deleteUserExercise,
    toggleFavorite,
  };
}
