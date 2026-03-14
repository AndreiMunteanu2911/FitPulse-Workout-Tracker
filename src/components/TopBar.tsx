"use client";

import { usePathname } from "next/navigation";

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
        <header className="fixed top-0 left-0 right-0 z-20 md:hidden h-12 flex items-center px-4 bg-gradient-to-b from-[#1e3a8a] to-[#1d4ed8] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-base font-bold text-white tracking-tight">{title}</span>
        </header>
    );
}
