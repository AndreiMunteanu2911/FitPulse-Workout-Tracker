import { describe, expect, it } from "vitest";
import { getDashboardShortcutItems, getDesktopNavItems, getMobileNavItems } from "@/lib/navigation";

describe("navigation helpers", () => {
  it("includes admin only in desktop nav for admins", () => {
    expect(getDesktopNavItems(false).map((item) => item.name)).not.toContain("Admin");
    expect(getDesktopNavItems(true).map((item) => item.name)).toContain("Admin");
  });

  it("returns only mobile-enabled items for mobile nav", () => {
    const mobileItems = getMobileNavItems();

    expect(mobileItems.length).toBeGreaterThan(0);
    expect(mobileItems.every((item) => item.mobile)).toBe(true);
    expect(mobileItems.map((item) => item.href)).toEqual([
      "/dashboard",
      "/workout",
      "/history",
      "/exercises",
      "/ai-coach",
      "/profile",
    ]);
  });

  it("uses non-mobile items as dashboard shortcuts and adds admin for admins", () => {
    expect(getDashboardShortcutItems(false).map((item) => item.name)).toEqual(["Blog", "Social", "Shop"]);
    expect(getDashboardShortcutItems(true).map((item) => item.name)).toEqual(["Blog", "Social", "Shop", "Admin"]);
  });
});
