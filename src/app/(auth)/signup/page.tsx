"use client";

import {useState} from "react";
import Link from "next/link";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { signupSchema, SignupInput } from "@/lib/validations";
import { ZodError } from "zod";

export default function SignUpPage() {
    const { signup } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Partial<Record<keyof SignupInput, string>>>({});
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setErrors({});

        try {
            signupSchema.parse({ email, password, confirmPassword });
            const data = await signup(email, password);
            if (data.user && !data.session) {
                setMessage("Account created! Please check your email to verify your account before logging in.");
            } else if (data.user && data.session) {
                setMessage("User account created and logged in.");
            } else {
                setMessage("User account created.");
            }
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            if (err instanceof ZodError) {
                const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};
                err.issues.forEach((e) => {
                    const field = e.path[0] as keyof SignupInput;
                    if (field) fieldErrors[field] = e.message;
                });
                setErrors(fieldErrors);
            } else if (err instanceof Error) {
                setMessage(err.message);
            } else {
                setMessage("Signup failed");
            }
        }
    };

    return (
        <div className="w-full text-white min-h-screen flex flex-col m-0 p-0">
            <div className="flex flex-row items-center mb-32 pt-2">
                <Image src="/assets/dumbbell-large.svg" alt="Dumbbell" width={40} height={40} className="invert" />
                <span className="ml-2 text-lg font-bold tracking-wide">FitPulse</span>
            </div>
            <div className="flex-1 flex flex-col justify-start">
                <div className="flex flex-row">
                    <Link href="/"><IconButton image="/assets/arrow.svg" variant="secondary" className="mr-4"></IconButton></Link>
                    <h1 className="text-3xl font-semibold mb-6">Sign Up</h1>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="Email"
                            required
                            className="rounded-sm px-4 py-3 bg-white/10 placeholder-white/70 text-white border border-white/20 focus:bg-white/20 w-full"
                        />
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="Password"
                            required
                            className="rounded-sm px-4 py-3 bg-white/10 placeholder-white/70 text-white border border-white/20 focus:bg-white/20 w-full"
                        />
                        {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <input
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            value={confirmPassword}
                            type="password"
                            placeholder="Confirm Password"
                            required
                            className="rounded-sm px-4 py-3 bg-white/10 placeholder-white/70 text-white border border-white/20 focus:bg-white/20 w-full"
                        />
                        {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                    <Button type="submit" className="mt-2" variant="secondary">Create account</Button>
                </form>
                {message && <div className="mt-3 text-white/90">{message}</div>}

                <div className="mt-6">
                    <Link href="/login">
                        <Button className="w-full" variant="primary">Already have an account?</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
