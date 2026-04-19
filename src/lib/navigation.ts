import {
  Dumbbell,
  History,
  LayoutDashboard,
  Library,
  Newspaper,
  ShoppingBag,
  Sparkles,
  User,
  Users,
  Shield,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  Icon: LucideIcon;
  mobile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", Icon: LayoutDashboard, mobile: true },
  { name: "Workout", href: "/workout", Icon: Dumbbell, mobile: true },
  { name: "History", href: "/history", Icon: History, mobile: true },
  { name: "Exercises", href: "/exercises", Icon: Library, mobile: true },
  { name: "AI Coach", href: "/ai-coach", Icon: Sparkles, mobile: true },
  { name: "Profile", href: "/profile", Icon: User, mobile: true },
  { name: "Blog", href: "/blog", Icon: Newspaper, mobile: false },
  { name: "Social", href: "/social", Icon: Users, mobile: false },
  { name: "Shop", href: "/shop", Icon: ShoppingBag, mobile: false },
];

const ADMIN_ITEM: NavItem = {
  name: "Admin",
  href: "/admin",
  Icon: Shield,
  mobile: false,
};

export function getDesktopNavItems(isAdmin: boolean) {
  return isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
}

export function getMobileNavItems() {
  return NAV_ITEMS.filter((item) => item.mobile);
}

export function getDashboardShortcutItems(isAdmin: boolean) {
  const extras = NAV_ITEMS.filter((item) => !item.mobile);
  return isAdmin ? [...extras, ADMIN_ITEM] : extras;
}
