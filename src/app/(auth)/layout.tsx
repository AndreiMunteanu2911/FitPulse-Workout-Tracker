import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "FitPulse - Workout Tracker",
    description: "Track your workouts and progress with ease.",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen w-full flex items-start justify-center auth-bg text-white">
            <main className="w-full max-w-sm px-5 pb-10">
                {children}
            </main>
        </div>
    );
}
