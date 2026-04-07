import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "@/components/DashboardStats";
import AdminDashboardCard from "@/components/AdminDashboardCard";
import Link from "next/link";
import { Sparkles, Dumbbell, History, Library, User, ChevronRight } from "lucide-react";

const quickActions = [
  { name: "Workout", href: "/workout", Icon: Dumbbell, color: "from-[var(--primary-500)] to-[var(--primary-600)]" },
  { name: "History", href: "/history", Icon: History, color: "from-[var(--primary-400)] to-[var(--primary-500)]" },
  { name: "Exercises", href: "/exercises", Icon: Library, color: "from-[var(--primary-600)] to-[var(--primary-700)]" },
  { name: "Profile", href: "/profile", Icon: User, color: "from-[var(--primary-300)] to-[var(--primary-500)]" },
];

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
      <div className="w-full">
        {/* Header — personalized greeting */}
        <div className="page-header mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>Dashboard</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">It&apos;s time to challenge your limits.</p>
            </div>
          </div>
        </div>

        {/* Admin Card (only visible to admins) */}
        <AdminDashboardCard />

        {/* Quick Action Buttons */}
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

        {/* AI Coach Promo Card — styled as a banner */}
        <Link
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
        </Link>

        {/* Stats & Charts Section */}
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
