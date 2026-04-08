'use client'

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

// Pages that don't require authentication
const PUBLIC_PAGES = ["/login", "/signup", "/"];
// Pages that don't require onboarding
const ONBOARDING_EXEMPT = ["/onboarding"];

export default function ProtectedWrapper({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [onboardingDone, setOnboardingDone] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkSession = async () => {
            const res = await fetch("/api/auth/session");
            if (!res.ok) {
                setAuthenticated(false);
                setReady(true);
                return;
            }
            const json = await res.json();
            setAuthenticated(true);
            setOnboardingDone(json.user?.onboarding_done ?? true);
            setReady(true);
        };
        checkSession();
    }, []);

    useEffect(() => {
        if (!ready) return;
        if (!authenticated && !PUBLIC_PAGES.includes(pathname ?? "")) {
            router.replace("/login");
            return;
        }
        if (authenticated && !onboardingDone && !ONBOARDING_EXEMPT.some(p => pathname === p || pathname?.startsWith(p + "/"))) {
            router.replace("/onboarding/gender");
        }
    }, [ready, authenticated, onboardingDone, pathname, router]);

    if (!ready) {
        return (
            <div className="flex justify-center items-center min-h-screen w-full text-center">
                <LoadingSpinner size={10} />
            </div>
        );
    }

    if (!authenticated && !PUBLIC_PAGES.includes(pathname ?? "")) {
        return null;
    }

    return <div className="w-full">{children}</div>;
}