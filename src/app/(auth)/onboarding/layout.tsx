import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { loadSessionUser } from "@/lib/auth-session";
import OnboardingShell from "./OnboardingShell";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await loadSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.onboarding_done) {
    redirect("/dashboard");
  }

  return (
    <AuthSessionProvider initialUser={user}>
      <OnboardingShell>{children}</OnboardingShell>
    </AuthSessionProvider>
  );
}
