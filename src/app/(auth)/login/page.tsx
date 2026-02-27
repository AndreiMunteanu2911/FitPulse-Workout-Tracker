'use client'

import {useState} from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import IconButton from "@/components/IconButton";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {

    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            setEmail("");
            setPassword("");
            setMessage(err instanceof Error ? err.message : "Login failed");
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
                    <h1 className="text-3xl font-semibold mb-6">Login</h1>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        type="email"
                        placeholder="Email"
                        required
                        className="rounded-sm px-4 py-3 bg-white/10 placeholder-white/70 text-white border border-white/20 focus:bg-white/20"
                    />
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        type="password"
                        placeholder="Password"
                        required
                        className="rounded-sm px-4 py-3 bg-white/10 placeholder-white/70 text-white border border-white/20 focus:bg-white/20"
                    />
                    <Button type="submit" className="mt-2" variant="secondary">Login</Button>
                </form>
                {message && <div className="mt-3 text-white/90">{message}</div>}

                <div className="mt-6">
                    <Link href="/signup">
                        <Button className="w-full" variant="primary">Don&apos;t have an account?</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
