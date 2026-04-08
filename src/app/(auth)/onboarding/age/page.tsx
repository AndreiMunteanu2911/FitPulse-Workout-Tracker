"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import NumberPicker from "@/components/NumberPicker";

export default function OnboardingAgePage() {
  const router = useRouter();
  const [age, setAge] = useState(25);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleContinue = async () => {
    const finalAge = showInput && inputValue ? parseInt(inputValue) : age;
    if (!finalAge || finalAge < 13 || finalAge > 100) return;
    const birthYear = new Date().getFullYear() - finalAge;
    const birthday = `${birthYear}-01-01`;
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthday }),
    });
    router.push("/onboarding/weight");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 13 && num <= 100) {
      setAge(num);
    }
  };

  const handleInputBlur = () => {
    setShowInput(false);
    setInputValue("");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        How Old Are You?
      </h2>
      <p className="text-white/50 text-sm text-center mb-10 max-w-xs">
        We use this to calculate age-appropriate fitness metrics and recommendations.
      </p>

      <div className="relative w-full max-w-xs mb-10">
        {/* Display value */}
        <div className="text-center mb-4">
          {showInput ? (
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              autoFocus
              min={13}
              max={100}
              className="text-6xl font-extrabold text-white bg-transparent text-center w-full outline-none border-b-2 border-[var(--lime-green)]"
              style={{ fontFamily: "var(--font-poppins)" }}
            />
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="text-6xl font-extrabold text-white hover:text-[var(--lime-green)] transition-colors"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {age}
            </button>
          )}
        </div>

        {/* Picker */}
        <div className="overflow-hidden">
          <NumberPicker
            value={age}
            onChange={setAge}
            min={13}
            max={100}
            height={220}
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
