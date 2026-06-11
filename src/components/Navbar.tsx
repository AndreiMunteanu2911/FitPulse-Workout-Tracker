"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/components/AuthSessionProvider";
import { getDesktopNavItems, getMobileNavItems } from "@/lib/navigation";
import { AppLogo } from "@/components/AppLogo";

export default function Navbar() {
  const pathname = usePathname();
  const { isAdmin } = useAuthSession();

  const desktopTabs = getDesktopNavItems(isAdmin);
  const mobileTabs = getMobileNavItems();

  return (
    <>
      <nav className="sticky top-0 z-20 hidden h-dvh w-64 shrink-0 flex-col bg-gradient-to-b from-[#5E3FDE] via-[#7457F5] to-[#896CFE] text-white shadow-[18px_0_45px_rgba(94,63,222,0.18)] md:flex">
        <div className="px-5 pb-7 pt-6">
          <AppLogo inverted prominent />
        </div>

        <ul className="flex flex-1 flex-col overflow-y-auto">
          {desktopTabs.map(({ name, href, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <li key={name}>
                <Link
                  href={href}
                  className={`group flex min-h-12 items-center gap-3 px-5 py-3 text-sm transition-colors ${
                    active
                      ? "bg-[var(--lime-green)] font-bold text-[#4A2FC2] shadow-[inset_4px_0_0_rgba(74,47,194,0.35)]"
                      : "text-white/70 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
                    active ? "bg-[#4A2FC2]/15" : ""
                  }`}>
                    <Icon className="size-[18px]" />
                  </span>
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#5E3FDE]/95 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-12px_34px_rgba(94,63,222,0.25)] backdrop-blur-xl md:hidden">
        <ul className="flex">
          {mobileTabs.map(({ name, href, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <li key={name} className="flex-1">
                <Link
                  href={href}
                  className={`relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 py-2 ${
                    active ? "bg-[var(--lime-green)]" : "hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "text-[#4A2FC2]" : "text-white/60"}`} />
                  <span className={`text-[10px] font-semibold leading-none ${active ? "text-[#4A2FC2]" : "text-white/60"}`}>
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
