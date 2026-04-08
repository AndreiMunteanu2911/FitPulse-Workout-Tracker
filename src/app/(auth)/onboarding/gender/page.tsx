"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Image from "next/image";

export default function OnboardingGenderPage() {
  const router = useRouter();
  const [gender, setGender] = useState<"male" | "female" | null>(null);

  const handleContinue = async () => {
    if (!gender) return;
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender }),
    });
    router.push("/onboarding/age");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        What&apos;s Your Gender
      </h2>
      <p className="text-white/50 text-sm text-center mb-10 max-w-xs">
        This helps us personalize your experience and calculate metrics accurately.
      </p>

      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        {/* Male */}
        <button
          onClick={() => setGender("male")}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden transition-all duration-100">
            <Image
              src={gender === "male" ? "/assets/male-icon.png" : "/assets/male-icon-off.png"}
              alt="Male"
              width={112}
              height={112}
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          </div>
          <span className={`text-base font-bold transition-colors duration-100 ${
            gender === "male" ? "text-[var(--lime-green)]" : "text-white/50"
          }`}>Male</span>
        </button>

        {/* Female */}
        <button
          onClick={() => setGender("female")}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden transition-all duration-100">
            <Image
              src={gender === "female" ? "/assets/female-icon.png" : "/assets/female-icon-off.png"}
              alt="Female"
              width={112}
              height={112}
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          </div>
          <span className={`text-base font-bold transition-colors duration-100 ${
            gender === "female" ? "text-[var(--lime-green)]" : "text-white/50"
          }`}>Female</span>
        </button>
      </div>

      <div className="mt-10 w-full max-w-xs">
        <Button
          onClick={handleContinue}
          disabled={!gender}
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
