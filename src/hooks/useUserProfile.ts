"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/services/api/apiFetch";

export interface UserProfile {
  display_name: string | null;
  birthday: string | null;
  gender: "male" | "female" | "other" | null;
  height_cm: number | null;
  onboarding_done: boolean;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ profile: UserProfile }>("/api/user/profile");
      setProfile(json.profile);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const json = await apiFetch<{ profile: UserProfile }>("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setProfile(json.profile);
      return true;
    } catch {
      // ignore
    }
    return false;
  }, []);

  return { profile, loading, fetchProfile, updateProfile };
}
