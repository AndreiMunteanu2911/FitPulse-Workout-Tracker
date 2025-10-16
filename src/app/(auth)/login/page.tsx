'use client'

import {useState} from "react";
import supabase from "@/helper/supabaseClient"
import Link from "next/link";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function LoginPage() {

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: any)=>{
        event.preventDefault();
        setMessage("");

        const {data,error} = await supabase.auth.signInWithPassword({
            email:email,
            password:password,
        });

        if (error)
        {
            setEmail("");
            setPassword("");
            setMessage(error.message);
            return;
        }
        if (data){
            router.push("/dashboard");
        }
        setEmail("");
        setPassword("");
    };

    return (
        <div className="w-full text-white">
            <h1 className="text-3xl font-semibold mb-6">Login</h1>
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
                    <Button className="w-full" variant="primary">Don't have an account?</Button>
                </Link>
            </div>
        </div>
    );
}
