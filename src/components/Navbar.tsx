"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getDesktopNavItems, getMobileNavItems } from "@/lib/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.user?.role === "admin"))
      .catch(() => {});
  }, []);

  const desktopTabs = getDesktopNavItems(isAdmin);
  const mobileTabs = getMobileNavItems();

  return (
    <>
      <nav className="hidden md:flex w-60 sticky top-0 h-screen flex-col bg-gradient-to-b from-[#5E3FDE] to-[#896CFE] text-white z-20">
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
          <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Image src="/assets/logo.png" alt="FitPulse" width={24} height={24} className="object-contain" />
          </div>
          <h1 className="text-xl tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
            <span className="font-extrabold text-white">Fit</span><span className="font-bold text-[var(--lime-green)]">Pulse</span>
          </h1>
        </div>

        <ul className="flex flex-col flex-1 overflow-y-auto">
          {desktopTabs.map(({ name, href, Icon }) => {
            const active = pathname === href;
            return (
              <li key={name} className="flex-shrink-0">
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-5 py-3.5 transition-all duration-150 text-sm ${
                    active
                      ? "bg-[var(--lime-green)] text-[#4A2FC2] font-bold"
                      : "text-white/60 hover:text-white/90 hover:bg-white/5"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? "bg-[#4A2FC2]/15" : "bg-transparent"
                  }`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-20 bg-[#5E3FDE] text-white">
        <ul className="flex">
          {mobileTabs.map(({ name, href, Icon }) => {
            const active = pathname === href;
            return (
              <li key={name} className="flex-1">
                <Link
                  href={href}
                  className={`relative flex flex-col items-center justify-center py-2.5 px-1 gap-1 transition-all duration-200 ${
                    active
                      ? "bg-[var(--lime-green)] text-[#4A2FC2]"
                      : ""
                  }`}
                >
                  <span
                    className={`absolute inset-x-3 top-0 h-0.5 rounded-full transition-opacity duration-200 ${
                      active ? "bg-[var(--lime-green)] opacity-100" : "bg-transparent opacity-0"
                    }`}
                  />
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    active ? "bg-[#4A2FC2]/20 scale-105" : ""
                  }`}>
                    <Icon className={`w-5 h-5 transition-all duration-200 ${active ? "text-[#4A2FC2]" : "text-white opacity-55"}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none transition-colors ${active ? "text-[#4A2FC2]" : "text-white/55"}`}>
                    {name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
