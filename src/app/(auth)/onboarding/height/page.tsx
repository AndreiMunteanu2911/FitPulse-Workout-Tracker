"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import NumberPicker from "@/components/NumberPicker";

export default function OnboardingHeightPage() {
  const router = useRouter();
  const [height, setHeight] = useState(170);

  const handleContinue = async () => {
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ height_cm: height }),
    });
    router.push("/onboarding/complete");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        What Is Your Height?
      </h2>
      <p className="text-white/50 text-sm text-center mb-10 max-w-xs">
        Combined with your weight, this helps us calculate your BMI and set realistic goals.
      </p>

      {/* Picker */}
      <div className="relative w-full max-w-xs mb-10">
        <div className="text-center mb-4">
          <span className="text-6xl font-extrabold text-white">{height}</span>
          <span className="text-xl text-white/40 ml-1">cm</span>
        </div>

        <div className="overflow-hidden">
          <NumberPicker
            value={height}
            onChange={setHeight}
            min={120}
            max={220}
            height={240}
          />
        </div>
      </div>

      <div className="w-full max-w-xs">
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
