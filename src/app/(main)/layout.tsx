import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { loadSessionUser } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "FitPulse - Workout Tracker",
  description: "Track your workouts and progress with ease.",
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await loadSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.onboarding_done) {
    redirect("/onboarding/gender");
  }

  return (
    <AuthSessionProvider initialUser={user}>
      <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <TopBar />
          {/* Spacer matching the fixed TopBar height so content is never hidden beneath it */}
          <div className="h-11 flex-shrink-0 md:hidden" aria-hidden="true" />
          <main className="flex-1 min-w-0 px-5 pt-5 pb-28 md:px-8 md:pt-6 md:pb-8 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
