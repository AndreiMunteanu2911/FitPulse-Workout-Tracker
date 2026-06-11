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
      <div className="flex min-h-dvh w-full bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="h-[var(--ph-top)] flex-shrink-0 md:hidden" aria-hidden="true" />
          <main className="page-shell min-w-0 flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
