"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import { LayoutDashboard, History, Dumbbell, Library, User } from "lucide-react";

const tabs = [
  { name: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { name: "History",   href: "/history",   Icon: History          },
  { name: "Workout",   href: "/workout",   Icon: Dumbbell         },
  { name: "Exercises", href: "/exercises", Icon: Library          },
  { name: "Profile",   href: "/profile",   Icon: User             },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <nav className="hidden md:flex w-60 sticky top-0 h-screen flex-col bg-gradient-to-b from-[#1e3a8a] to-[#1d4ed8] text-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.25)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-white/15 flex items-center justify-center flex-shrink-0">
            <Image src="/assets/dumbbell-large.svg" alt="FitPulse" width={22} height={22} className="brightness-0 invert" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">FitPulse</h1>
        </div>

        {/* Nav items */}
        <ul className="flex flex-col gap-0.5 flex-1 overflow-y-auto px-3">
          {tabs.map(({ name, href, Icon }) => {
            const active = pathname === href;
            return (
              <li key={name}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[var(--radius-lg)] transition-all duration-150 text-sm font-medium ${
                    active
                      ? "bg-white/20 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                      : "text-white/60 hover:text-white/90 hover:bg-white/10"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-white/20" : "bg-transparent"}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  {name}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-4 py-5 border-t border-white/10">
          <DarkModeToggle />
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-20 bg-[#1d4ed8] shadow-[0_-4px_20px_rgba(29,78,216,0.4)]">
        <ul className="flex">
          {tabs.map(({ name, href, Icon }) => {
            const active = pathname === href;
            return (
              <li key={name} className="flex-1">
                <Link
                  href={href}
                  className="flex flex-col items-center justify-center py-2 px-1 gap-1 relative"
                >
                  <div className={`w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center transition-all duration-150 ${
                    active ? "bg-white/20 scale-105" : ""
                  }`}>
                    <Icon className={`w-[22px] h-[22px] transition-all duration-150 ${active ? "opacity-100" : "opacity-55"}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none transition-colors ${active ? "text-white" : "text-white/55"}`}>
                    {name}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-white" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
