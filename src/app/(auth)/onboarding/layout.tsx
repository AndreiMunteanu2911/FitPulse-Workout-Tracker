"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

const STEPS = [
  { path: "/onboarding/gender", label: "Gender" },
  { path: "/onboarding/age", label: "Age" },
  { path: "/onboarding/weight", label: "Weight" },
  { path: "/onboarding/height", label: "Height" },
];

const COMPLETE_PATH = "/onboarding/complete";

function getStepIndex(pathname: string): number {
  const idx = STEPS.findIndex((s) => pathname === s.path);
  return idx >= 0 ? idx : -1;
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const currentStep = getStepIndex(pathname ?? "");
  const isComplete = pathname === COMPLETE_PATH;

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const json = await res.json();
      if (json.user?.onboarding_done) {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    };
    check();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size={10} />
      </div>
    );
  }

  // Don't show progress bar on complete page
  if (isComplete) {
    return (
      <div className="w-full min-h-screen flex flex-col text-white" style={{ fontFamily: "var(--font-poppins)" }}>
        {/* Top bar - no back button on complete */}
        <div className="flex items-center justify-end px-5 pt-6 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] overflow-hidden bg-white flex items-center justify-center">
              <Image src="/assets/logo.png" alt="FitPulse" width={18} height={18} className="object-contain" />
            </div>
            <span className="text-sm font-extrabold tracking-tight">
              <span className="text-white">Fit</span><span className="text-[var(--lime-green)]">Pulse</span>
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    );
  }

  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full min-h-screen flex flex-col text-white" style={{ fontFamily: "var(--font-poppins)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <button
          onClick={() => {
            if (currentStep > 0) {
              router.push(STEPS[currentStep - 1].path);
            } else {
              router.push("/login");
            }
          }}
          className="flex items-center gap-1 text-[var(--lime-green)] text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] overflow-hidden bg-white flex items-center justify-center">
            <Image src="/assets/logo.png" alt="FitPulse" width={18} height={18} className="object-contain" />
          </div>
          <span className="text-sm font-extrabold tracking-tight">
            <span className="text-white">Fit</span><span className="text-[var(--lime-green)]">Pulse</span>
          </span>
        </div>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-2">
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--lime-green)] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-white/40 mt-1.5 text-right">{currentStep + 1} of {totalSteps}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
