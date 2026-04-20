"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/types";

type AuthSessionContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onboardingDone: boolean;
  refreshSession: () => Promise<User | null>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const refreshSession = async () => {
    const res = await fetch("/api/auth/session");
    if (!res.ok) {
      setUser(null);
      return null;
    }

    const data = await res.json();
    const nextUser = data.user ?? null;
    setUser(nextUser);
    return nextUser;
  };

  const value: AuthSessionContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    onboardingDone: user?.onboarding_done ?? false,
    refreshSession,
  };

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }
  return value;
}
