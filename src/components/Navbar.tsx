"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const tabs = [
    /*{ name: "Dashboard", href: "/dashboard", icon: "/assets/icon-dashboard.svg" },*/
    { name: "History", href: "/history", icon: "/assets/icon-history.svg" },
    { name: "Workout", href: "/workout", icon: "/assets/icon-workout.svg" },
    { name: "Exercises", href: "/exercises", icon: "/assets/icon-exercises.svg" },
    { name: "Profile", href: "/profile", icon: "/assets/icon-profile.svg" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <>
            {/* Sidebar for desktop */}
            <nav className="hidden md:flex w-64 sticky top-0 h-screen p-6 flex-col bg-[var(--primary-700)] text-white">

                <div className="flex items-center flex-row justify-between mb-12">
                    <h1 className="text-4xl font-semibold">FitPulse</h1>
                    <img src="/assets/dumbbell-large.svg" alt="Dumbbell" width={40} height={40} className="invert" />
                </div>
                <ul className="flex flex-col gap-2">
                    {tabs.map((tab) => (
                        <li key={tab.name}>
                            <Link
                                href={tab.href}
                                className={`flex items-center px-4 py-2 rounded-sm transition hover:bg-white/10 ${
                                    pathname === tab.href ? "bg-white/20 font-semibold" : ""
                                }`}
                            >
                                <Image
                                    src={tab.icon}
                                    alt={tab.name + " icon"}
                                    width={24}
                                    height={24}
                                    className="mr-3 invert brightness-0"
                                />
                                {tab.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom navbar for mobile */}
            <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[var(--primary-700)] text-white mt-20">
                <ul className="flex justify-around py-1">
                    {tabs.map((tab) => (
                        <li key={tab.name}>
                            <Link
                                href={tab.href}
                                className={`flex flex-col items-center justify-center py-2 text-sm ${
                                    pathname === tab.href ? "font-semibold" : "opacity-90"
                                }`}
                            >
                                <Image
                                    src={tab.icon}
                                    alt={tab.name + " icon"}
                                    width={24}
                                    height={24}
                                    className="invert brightness-0"
                                />
                                <span className="mt-1">{tab.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}
