"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import NumberPicker from "@/components/NumberPicker";

export default function OnboardingWeightPage() {
  const router = useRouter();
  const [weight, setWeight] = useState(75);

  const handleContinue = async () => {
    await fetch("/api/weight-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weight: weight,
        log_date: new Date().toISOString().split("T")[0],
      }),
    });
    router.push("/onboarding/height");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        What Is Your Weight?
      </h2>
      <p className="text-white/50 text-sm text-center mb-8 max-w-xs">
        We use this to track your progress and personalize your nutrition targets.
      </p>

      {/* Picker */}
      <div className="relative w-full max-w-xs mb-4">
        <div className="text-center mb-2">
          <span className="text-5xl font-extrabold text-white">{weight}</span>
          <span className="text-xl text-white/50 ml-1">Kg</span>
        </div>

        <div className="overflow-hidden">
          <NumberPicker
            value={weight}
            onChange={setWeight}
            min={30}
            max={200}
            height={180}
          />
        </div>
      </div>

      <div className="w-full max-w-xs mt-8">
        <Button
          onClick={handleContinue}
          block
          variant="lime"
          className="!py-3 !text-base"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
