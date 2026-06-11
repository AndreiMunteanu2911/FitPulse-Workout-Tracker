"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ZodError } from "zod";
import { AppLogo } from "@/components/AppLogo";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrors({});
    setLoading(true);

    try {
      loginSchema.parse({ email, password });
      await login(email, password);
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof LoginInput;
          if (field) fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        setMessage(error instanceof Error ? error.message : "Login failed");
      }
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col text-white">
      <div className="pb-2 pt-6">
        <AppLogo href="/" inverted />
      </div>

      <div className="flex w-full max-w-sm flex-1 flex-col justify-center py-8">
        <div className="mb-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
            <ChevronLeft className="size-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm text-white/55">Sign in to continue tracking your training.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="auth-input"
            />
            {errors.email ? <p className="mt-1.5 text-xs font-medium text-red-200">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              value={password}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className="auth-input"
            />
            {errors.password ? <p className="mt-1.5 text-xs font-medium text-red-200">{errors.password}</p> : null}
          </div>

          {message ? (
            <div role="alert" className="rounded-[var(--radius-md)] border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
              {message}
            </div>
          ) : null}

          <Button type="submit" disabled={loading} block variant="lime" className="!py-3 !text-base">
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/55">
          New to FitPulse?{" "}
          <Link href="/signup" className="font-semibold text-white transition hover:text-white/80">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
