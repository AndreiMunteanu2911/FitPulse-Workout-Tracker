import type { Metadata } from "next";
import "@/app/globals.css";
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
    <div className="flex min-h-screen w-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-x-hidden">
      <Navbar />
      <main className="flex-1 min-h-screen p-4 md:p-8 page-shell bg-white text-[var(--color-foreground)] pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
