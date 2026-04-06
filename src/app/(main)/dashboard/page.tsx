import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "@/components/DashboardStats";
import AdminDashboardCard from "@/components/AdminDashboardCard";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
      <div className="w-full">
        <div className="page-header mb-6">
          <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Your fitness overview</p>
        </div>

        {/* Admin Card (only visible to admins) */}
        <AdminDashboardCard />

        {/* AI Coach Promo Card */}
        <Link
          href="/ai-coach"
          className="block mb-6 p-5 rounded-2xl border border-[var(--primary-500)]/30
            bg-gradient-to-r from-[var(--primary-600)]/10 to-[var(--primary-400)]/5
            dark:from-[var(--primary-600)]/15 dark:to-[var(--primary-400)]/10
            hover:border-[var(--primary-500)]/60 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-600)] flex items-center justify-center flex-shrink-0
              group-hover:bg-[var(--primary-700)] transition-colors">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-0.5">
                AI Coach
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Get personalized insights from your workout data. Ask about progress, create workouts, or get training recommendations.
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--primary-600)] flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <DashboardStats />
      </div>
    </ProtectedWrapper>
  );
}
