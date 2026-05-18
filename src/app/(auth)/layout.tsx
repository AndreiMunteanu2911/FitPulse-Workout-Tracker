import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/auth-session";

export const metadata: Metadata = {
    title: "FitPulse - Workout Tracker",
    description: "Track your workouts and progress with ease.",
};

export default async function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await loadSessionUser();

    if (user?.onboarding_done) {
        redirect("/dashboard");
    }

    if (user) {
        redirect("/onboarding/gender");
    }

    return (
        <div className="min-h-screen w-full flex items-start justify-center auth-bg text-white">
            <main className="w-full max-w-sm px-5 pb-10">
                {children}
            </main>
        </div>
    );
}
