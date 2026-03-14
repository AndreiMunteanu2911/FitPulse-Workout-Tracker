import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FitPulse - Workout Tracker",
  description: "Track your workouts and progress with ease.",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-x-hidden min-h-screen px-4 pt-4 pb-24 md:px-8 md:pt-6 md:pb-8 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}
