import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="w-full text-white min-h-screen flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pt-6 pb-2">
                <div className="w-9 h-9 rounded-[12px] bg-white/15 flex items-center justify-center">
                    <Image src="/assets/dumbbell-large.svg" alt="FitPulse" width={20} height={20} className="brightness-0 invert" />
                </div>
                <span className="text-lg font-extrabold tracking-tight">FitPulse</span>
            </div>

            {/* Hero */}
            <div className="flex-1 flex flex-col justify-center py-10">
                <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/80 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Your fitness journey starts here
                    </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-4">
                    Track workouts.<br />
                    <span className="text-white/60">Crush goals.</span>
                </h1>
                <p className="text-white/60 text-base mb-10 max-w-xs">
                    Log every rep, monitor your progress, and build unstoppable habits with FitPulse.
                </p>

                <div className="flex flex-col gap-3">
                    <Link href="/signup">
                        <button className="w-full py-3.5 rounded-xl bg-white text-[var(--primary-700)] font-bold text-base shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:bg-white/90 transition active:scale-[0.98]">
                            Get Started — It&apos;s Free
                        </button>
                    </Link>
                    <Link href="/login">
                        <button className="w-full py-3.5 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-base hover:bg-white/15 transition active:scale-[0.98]">
                            Log In
                        </button>
                    </Link>
                </div>
            </div>

            {/* Feature pills */}
            <div className="pb-8 flex flex-wrap gap-2">
                {["Workout history", "Personal records", "Weight tracking", "Progress photos"].map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs font-medium text-white/60">{f}</span>
                ))}
            </div>
        </div>
    );
}
