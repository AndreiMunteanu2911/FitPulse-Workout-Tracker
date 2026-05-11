"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { Dumbbell, TrendingUp, Heart } from "lucide-react";
import { useAuthSession } from "@/components/AuthSessionProvider";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { user, refreshSession } = useAuthSession();
  const userName = user?.display_name?.split(" ")[0] || "there";

  async function handleFinish(): Promise<void> {
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_done: true }),
    });
    await refreshSession();
    router.push("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      {/* Success icon — lime green circle with black checkmark */}
      <div className="w-24 h-24 mb-6">
        <svg viewBox="0 0 96 96" className="w-full h-full">
          <circle cx="48" cy="48" r="46" fill="var(--lime-green)" />
          <path
            d="M30 50 L43 63 L68 35"
            stroke="#1a1a1a"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        You&apos;re All Set, {userName}!
      </h2>
      <p className="text-white/50 text-sm text-center mb-10 max-w-xs">
        Your profile is ready. Let&apos;s start building your fitness journey.
      </p>

      {/* Feature highlights */}
      <div className="w-full max-w-xs space-y-3 mb-10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-500)]/20 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-[var(--primary-400)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Track Workouts</p>
            <p className="text-xs text-white/40">Log every set, rep, and weight</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-500)]/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-[var(--primary-400)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">See Progress</p>
            <p className="text-xs text-white/40">Charts, PRs, and personal records</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-500)]/20 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-[var(--primary-400)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Stay Healthy</p>
            <p className="text-xs text-white/40">Body metrics and progress photos</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <Button
          onClick={handleFinish}
          block
          variant="lime"
          className="!py-3 !text-base"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
