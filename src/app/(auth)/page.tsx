import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

const features = ["Workout history", "Personal records", "Weight tracking", "Progress photos"];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col text-white">
      <div className="pb-2 pt-6">
        <AppLogo href="/" inverted />
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
            <span className="size-1.5 rounded-full bg-[var(--lime-green)]" />
            Training, progress, and coaching
          </span>
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-[1.08] tracking-[-0.05em] sm:text-5xl">
          Train with clarity.
          <br />
          <span className="text-[var(--lime-green)]">Measure what matters.</span>
        </h1>
        <p className="mb-10 max-w-sm text-base leading-7 text-white/60">
          Log workouts, follow your progress, and keep your training history organized in one place.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--lime-green)] px-5 py-3.5 text-base font-bold text-[#232323] shadow-[0_2px_12px_rgba(226,241,99,0.35)] transition hover:brightness-105 hover:shadow-[0_4px_18px_rgba(226,241,99,0.45)] active:scale-[0.98]"
          >
            Get Started - It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-white/15 active:scale-[0.98]"
          >
            Log In
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-8">
        {features.map((feature) => (
          <span key={feature} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/55">
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}
