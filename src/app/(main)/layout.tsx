import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";

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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <TopBar />
        {/* Spacer matching the fixed TopBar height so content is never hidden beneath it */}
        <div className="h-11 flex-shrink-0 md:hidden" aria-hidden="true" />
        <main className="flex-1 min-w-0 px-4 pt-4 pb-24 md:px-8 md:pt-6 md:pb-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
