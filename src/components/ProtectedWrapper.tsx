'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProtectedWrapper({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const res = await fetch("/api/auth/session");
            setAuthenticated(res.ok);
            setLoading(false);
        };
        checkSession();
    }, []);

    useEffect(() => {
        if (!loading && !authenticated) {
            router.push("/login");
        }
    }, [loading, authenticated, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen w-full text-center">
                <LoadingSpinner size={10} />
            </div>
        );
    }

    if (!authenticated) {
        return null;
    }

    return <div className="w-full">{children}</div>;
}