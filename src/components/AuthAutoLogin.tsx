"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const REMEMBER_LOGIN_KEY = "fitpulse:remember-login";

type RememberedLogin = {
  email: string;
  password: string;
};

export default function AuthAutoLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    if (autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;

    try {
      const saved = window.localStorage.getItem(REMEMBER_LOGIN_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<RememberedLogin>;
      const email = typeof parsed.email === "string" ? parsed.email : "";
      const password = typeof parsed.password === "string" ? parsed.password : "";
      if (!email || !password) return;

      void login(email, password, true)
        .then(() => {
          router.replace("/dashboard");
        })
        .catch(() => {
          window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
        });
    } catch {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }
  }, [login, router]);

  return null;
}
