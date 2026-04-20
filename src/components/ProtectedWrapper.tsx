'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthSession } from "@/components/AuthSessionProvider";

export default function ProtectedWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isAuthenticated, onboardingDone } = useAuthSession();

    useEffect(() => {
        if (!user && !isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (user && !onboardingDone) {
            router.replace("/onboarding/gender");
        }
    }, [user, isAuthenticated, onboardingDone, router]);

    if (!user && !isAuthenticated) {
        return (
            <div className="flex justify-center items-center min-h-screen w-full text-center">
                <LoadingSpinner size={10} />
            </div>
        );
    }

    return <div className="w-full">{children}</div>;
}
