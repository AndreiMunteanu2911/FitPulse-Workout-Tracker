"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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

export default function OnboardingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const currentStep = getStepIndex(pathname);
  const isComplete = pathname === COMPLETE_PATH;

  if (isComplete) {
    return (
      <div className="w-full min-h-screen flex flex-col text-white" style={{ fontFamily: "var(--font-poppins)" }}>
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
  const progress = currentStep >= 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="w-full min-h-screen flex flex-col text-white" style={{ fontFamily: "var(--font-poppins)" }}>
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
        <div className="w-12" />
      </div>

      <div className="px-5 mb-2">
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--lime-green)] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-white/40 mt-1.5 text-right">{currentStep + 1} of {totalSteps}</p>
      </div>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
