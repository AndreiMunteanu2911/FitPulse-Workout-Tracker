import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "@/components/DashboardStats";
import DashboardShortcuts from "@/components/DashboardShortcuts";
import Link from "next/link";
import { Dumbbell, History, Library, User } from "lucide-react";

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

        <DashboardShortcuts />

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
