'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/helper/supabaseClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProtectedWrapper({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            setAuthenticated(!!session);
            setLoading(false);
        };

        getSession();
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