'use client'

import {useState} from "react";
import supabase from "@/helper/supabaseClient"
import Link from "next/link";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: any)=>{
        event.preventDefault();
        setMessage("");

        const {data,error} = await supabase.auth.signUp({
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
            setMessage("User account created");
        }
        setEmail("");
        setPassword("");
    };

    return (
        <div className="w-full text-white min-h-screen flex flex-col m-0 p-0">
            <div className="flex flex-row items-center mb-32 pt-2">
                <img src="/assets/dumbbell-large.svg" alt="Dumbbell" width={40} height={40} className="invert" />
                <span className="ml-2 text-lg font-bold tracking-wide">FitPulse</span>
            </div>
            <div className="flex-1 flex flex-col justify-start">
                <div className="flex flex-row">
                    <Link href="/"><IconButton image="/assets/arrow.svg" variant="secondary" className="mr-4"></IconButton></Link>
                    <h1 className="text-3xl font-semibold mb-6">Sign Up</h1>
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
