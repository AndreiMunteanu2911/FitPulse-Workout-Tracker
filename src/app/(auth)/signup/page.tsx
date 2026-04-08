"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Button from "@/components/Button";

export default function SignUpPage() {
    const { signup } = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!fullName.trim()) e.fullName = "Name is required";
        if (!email.includes("@")) e.email = "Invalid email";
        if (password.length < 6) e.password = "At least 6 characters";
        if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        if (!validate()) return;
        setLoading(true);

        try {
            const data = await signup(email, password, fullName.trim());
            if (data.user && data.session) {
                // Auto-logged in → go to onboarding
                router.push("/onboarding");
            } else if (data.user) {
                // Email confirmation required
                setMessage("Account created! Check your email to verify, then log in.");
            }
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : "Signup failed");
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
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Create account</h1>
                    <p className="text-white/60 text-sm">Start your fitness journey today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Full Name</label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.fullName && <p className="text-white text-xs mt-1 font-semibold">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="you@email.com"
                            className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.email && <p className="text-white text-xs mt-1 font-semibold">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.password && <p className="text-white text-xs mt-1 font-semibold">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">Confirm Password</label>
                        <input
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                        />
                        {errors.confirmPassword && <p className="text-white text-xs mt-1 font-semibold">{errors.confirmPassword}</p>}
                    </div>

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
                        {loading ? "Creating account..." : "Create Account"}
                    </Button>
                </form>

                <p className="text-center text-white/60 text-sm mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-white font-semibold hover:text-white/80 transition">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
