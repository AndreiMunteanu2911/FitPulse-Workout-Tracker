'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Users, LayoutTemplate, BarChart3, Shield, ShoppingBag, Package } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminNavCard from "@/components/admin/AdminNavCard";
import TimeRangeSelector from "@/components/admin/TimeRangeSelector";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkouts: number;
  totalSets: number;
}

const adminLinks = [
  { href: "/admin/exercises", title: "Exercises", desc: "Manage the standard exercise catalogue", icon: Dumbbell, color: "bg-[var(--primary-500)]" },
  { href: "/admin/users", title: "Users", desc: "View and manage user accounts and roles", icon: Users, color: "bg-[var(--primary-600)]" },
  { href: "/admin/templates", title: "Templates", desc: "Create and edit official workout templates", icon: LayoutTemplate, color: "bg-[var(--primary-700)]" },
  { href: "/admin/analytics", title: "Analytics", desc: "Platform-wide usage metrics and charts", icon: BarChart3, color: "bg-[var(--primary-400)]" },
  { href: "/admin/shop", title: "Shop", desc: "Add products and manage store inventory", icon: ShoppingBag, color: "bg-[var(--primary-800)]" },
  { href: "/admin/orders", title: "Orders", desc: "Review purchases and update fulfillment status", icon: Package, color: "bg-[var(--primary-500)]" },
];

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) { router.push("/login"); return; }
      const session = await sessionRes.json();
      if (session.user?.role !== "admin") { router.push("/dashboard"); return; }
      setIsAdmin(true);

      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setStats(json.analytics);
      }
      setLoading(false);
    }
    load();
  }, [router, days]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="page-header mb-6">
          <Skeleton width={80} height={28} className="mb-2" />
          <Skeleton width={140} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={80} className="rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={80} className="rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Admin"
        subtitle="Manage the platform"
      />

      {/* Time Range Selector */}
      <TimeRangeSelector value={days} onChange={setDays} />

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <AdminStatCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} in ${days}d`}
            accentColor="bg-[var(--primary-500)]"
          />
          <AdminStatCard
            title="Total Workouts"
            value={stats.totalWorkouts}
            accentColor="bg-[var(--primary-600)]"
          />
          <AdminStatCard
            title="Total Sets"
            value={stats.totalSets}
            accentColor="bg-[var(--primary-700)]"
          />
          <AdminStatCard
            title="Admin"
            value="Management Panel"
            icon={<Shield className="w-4 h-4 text-[var(--primary-500)]" />}
            accentColor="bg-[var(--primary-400)]"
          />
        </div>
      )}

      {/* Admin Section Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {adminLinks.map((link) => (
          <AdminNavCard
            key={link.href}
            href={link.href}
            title={link.title}
            description={link.desc}
            icon={link.icon}
            color={link.color}
          />
        ))}
      </div>
    </div>
  );
}
