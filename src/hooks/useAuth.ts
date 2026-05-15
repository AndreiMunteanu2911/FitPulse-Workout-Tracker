"use client";

import { apiFetch } from "@/services/api/apiFetch";
import type { User } from "@/types";

type AuthResponse = {
  user?: User | null;
  session?: unknown;
};

const REMEMBER_LOGIN_KEY = "fitpulse:remember-login";

interface UseAuthResult {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  signup: (email: string, password: string, displayName?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getSession: () => Promise<User | null>;
}

export function useAuth(): UseAuthResult {
  async function login(email: string, password: string, rememberMe = false): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });
  }

  async function signup(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
  }

  async function logout(): Promise<void> {
    await apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }
  }

  async function getSession(): Promise<User | null> {
    try {
      const data = await apiFetch<{ user?: User | null }>("/api/auth/session", { allowAuthRedirect: false });
      return data.user ?? null;
    } catch {
      return null;
    }
  }

  return { login, signup, logout, getSession };
}
