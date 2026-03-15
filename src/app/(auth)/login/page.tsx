"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, LoginInput } from "@/lib/validations";
import { ZodError } from "zod";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setErrors({});
        setLoading(true);

        try {
            loginSchema.parse({ email, password });
            await login(email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            if (err instanceof ZodError) {
                const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
                err.issues.forEach((e) => {
                    const field = e.path[0] as keyof LoginInput;
                    if (field) fieldErrors[field] = e.message;
                });
                setErrors(fieldErrors);
            } else if (err instanceof Error) {
                setMessage(err.message);
            } else {
                setMessage("Login failed");
            }
            setEmail("");
            setPassword("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col text-white">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pt-6 pb-2">
                <div className="w-9 h-9 rounded-[12px] bg-white/15 flex items-center justify-center">
                    <Image src="/assets/dumbbell-large.svg" alt="FitPulse" width={20} height={20} className="brightness-0 invert" />
                </div>
                <span className="text-lg font-extrabold tracking-tight">FitPulse</span>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-sm w-full py-8">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">Welcome back</h1>
                    <p className="text-white/60 text-sm">Log in to continue your journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="you@email.com"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.email && <p className="text-red-300 text-xs mt-1 font-medium">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.password && <p className="text-red-300 text-xs mt-1 font-medium">{errors.password}</p>}
                    </div>

                    {message && (
                        <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-sm text-white/90">{message}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-white text-[var(--primary-700)] font-bold text-base shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:bg-white/90 transition disabled:opacity-60 active:scale-[0.98]"
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <p className="text-center text-white/60 text-sm mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-white font-semibold hover:text-white/80 transition">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
