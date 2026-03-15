"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/history": "History",
    "/workout": "Workout",
    "/exercises": "Exercises",
    "/profile": "Profile",
};

export default function TopBar() {
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname];

    if (!title) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-20 md:hidden h-11 flex items-center justify-between px-4 bg-gradient-to-r from-[#1e3a8a] to-[#1d4ed8] shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
            <span className="text-lg font-bold text-white tracking-tight">{title}</span>
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Image src="/assets/dumbbell-large.svg" alt="FitPulse" width={18} height={18} className="brightness-0 invert" />
            </div>
        </header>
    );
}
