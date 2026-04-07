'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Users, Dumbbell, TrendingUp } from "lucide-react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminQuickLinks from "@/components/admin/AdminQuickLinks";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkouts: number;
  totalSets: number;
}

export default function AdminDashboardCard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) { setIsAdmin(false); setLoading(false); return; }
        const session = await sessionRes.json();
        if (session.user?.role !== "admin") { setIsAdmin(false); setLoading(false); return; }

        setIsAdmin(true);

        const analyticsRes = await fetch("/api/admin/analytics");
        if (analyticsRes.ok) {
          const json = await analyticsRes.json();
          setStats(json.analytics);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  if (!isAdmin && !loading) return null;
  // Don't render anything while loading role — prevents non-admins from seeing admin skeletons
  if (loading) return null;

  return (
    <div className="mb-6">
      <Link
          href="/admin"
          className="block mb-4 p-5 rounded-sm
            bg-gradient-to-r from-[var(--primary-600)]/10 to-[var(--primary-400)]/5
            dark:from-[var(--primary-600)]/15 dark:to-[var(--primary-400)]/10
            transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-600)] flex items-center justify-center flex-shrink-0
              group-hover:bg-[var(--primary-700)] transition-colors">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-0.5" style={{ fontFamily: "var(--font-poppins)" }}>
                Admin Dashboard
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Manage exercises, users, templates, and view platform analytics.
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--primary-600)] flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <AdminStatCard
            title="Users"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} in 30d`}
            icon={<Users className="w-3.5 h-3.5" />}
            accentColor="bg-[var(--primary-500)]"
          />
          <AdminStatCard
            title="Workouts"
            value={stats.totalWorkouts}
            icon={<Dumbbell className="w-3.5 h-3.5" />}
            accentColor="bg-[var(--primary-600)]"
          />
          <AdminStatCard
            title="Sets"
            value={stats.totalSets}
            accentColor="bg-[var(--primary-700)]"
          />
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 relative overflow-hidden">
            <div className="absolute left-0 inset-y-0 w-1 bg-[var(--lime-green)]" />
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Quick Links</p>
            </div>
            <AdminQuickLinks
              links={[
                { href: "/admin/exercises", label: "Exercises" },
                { href: "/admin/users", label: "Users" },
                { href: "/admin/analytics", label: "Analytics" },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
