import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "@/components/DashboardStats";
import AdminDashboardCard from "@/components/AdminDashboardCard";
import Link from "next/link";
import { Sparkles, Dumbbell, History, Library, User, ChevronRight } from "lucide-react";
import { getDashboardShortcutItems } from "@/lib/navigation";

const quickActions = [
  { name: "Workout", href: "/workout", Icon: Dumbbell, color: "from-[var(--primary-500)] to-[var(--primary-600)]" },
  { name: "History", href: "/history", Icon: History, color: "from-[var(--primary-400)] to-[var(--primary-500)]" },
  { name: "Exercises", href: "/exercises", Icon: Library, color: "from-[var(--primary-600)] to-[var(--primary-700)]" },
  { name: "Profile", href: "/profile", Icon: User, color: "from-[var(--primary-300)] to-[var(--primary-500)]" },
];

const shortcutMeta: Record<string, { description: string; color: string }> = {
  "/blog": {
    description: "Read training guides and updates.",
    color: "from-[var(--primary-500)] to-[var(--primary-700)]",
  },
  "/social": {
    description: "See what the community is posting.",
    color: "from-[var(--primary-400)] to-[var(--primary-600)]",
  },
  "/shop": {
    description: "Browse products and store items.",
    color: "from-[var(--primary-600)] to-[var(--primary-800)]",
  },
  "/admin": {
    description: "Manage the platform and review reports.",
    color: "from-[var(--primary-700)] to-[var(--primary-900)]",
  },
};

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
      <div className="w-full">
        <div className="page-header mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                Dashboard
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">It&apos;s time to challenge your limits.</p>
            </div>
          </div>
        </div>

        <AdminDashboardCard />

        <div className="mb-6">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ name, href, Icon, color }) => (
              <Link
                key={name}
                href={href}
                className="flex flex-col items-center gap-2 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center transition-shadow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-[var(--foreground)]">{name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Shortcuts</p>
              <h2 className="mt-1 text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
                More places to go
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {getDashboardShortcutItems(false).map(({ name, href, Icon }) => {
              const meta = shortcutMeta[href] || {
                description: "Open this section.",
                color: "from-[var(--primary-500)] to-[var(--primary-700)]",
              };

              return (
                <Link
                  key={name}
                  href={href}
                  className="group flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
                >
                  <div className={`h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--foreground)]">{name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{meta.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </div>

        {/*<Link
          href="/ai-coach"
          className="block mb-6 p-5 rounded-sm
            bg-gradient-to-r from-[var(--primary-600)]/10 to-[var(--primary-400)]/5
            dark:from-[var(--primary-600)]/15 dark:to-[var(--primary-400)]/10
            transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                AI Coach
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Get personalized insights from your workout data.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--primary-600)] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>*/}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>Your Stats</h2>
          </div>
          <DashboardStats />
        </div>
      </div>
    </ProtectedWrapper>
  );
}
