'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/helper/supabaseClient";

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
        return <div>Loading....</div>;
    }

    if (!authenticated) {
        return null;
    }

    return <div>{children}</div>;
}
