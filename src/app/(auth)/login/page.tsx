"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, LoginInput } from "@/lib/validations";
import { ZodError } from "zod";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";

const REMEMBER_LOGIN_KEY = "fitpulse:remember-login";

type RememberedLogin = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(REMEMBER_LOGIN_KEY);
            if (!saved) return;
            const parsed = JSON.parse(saved) as Partial<RememberedLogin>;
            if (typeof parsed.email === "string") setEmail(parsed.email);
            if (typeof parsed.password === "string") setPassword(parsed.password);
            setRememberMe(true);
        } catch {
            window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setErrors({});
        setLoading(true);

        try {
            loginSchema.parse({ email, password });
            await login(email, password);
            if (rememberMe) {
                window.localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify({ email, password }));
            } else {
                window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
            }
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
                <div className="w-9 h-9 rounded-[12px] overflow-hidden bg-white flex items-center justify-center">
                    <Image src="/assets/logo.png" alt="FitPulse" width={22} height={22} className="object-contain" />
                </div>
                <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                    <span className="font-extrabold text-white">Fit</span><span className="font-bold text-[var(--lime-green)]">Pulse</span>
                </span>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-sm w-full py-8">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Welcome back</h1>
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
                            className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.email && <p className="text-white text-xs mt-1 font-semibold">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.password && <p className="text-white text-xs mt-1 font-semibold">{errors.password}</p>}
                    </div>

                    <label className="flex items-center gap-3 text-sm font-semibold text-white/75">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) => {
                                setRememberMe(event.target.checked);
                                if (!event.target.checked) {
                                    window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
                                }
                            }}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 accent-[var(--lime-green)]"
                        />
                        Remember me on this device
                    </label>

                    {message && (
                        <div className="p-3 rounded-full bg-white/10 border border-white/15 text-sm text-white/90">{message}</div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        block
                        variant="lime"
                        className="!py-3 !text-base"
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </Button>
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
