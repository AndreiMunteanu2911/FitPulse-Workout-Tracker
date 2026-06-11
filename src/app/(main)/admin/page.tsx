'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Users, LayoutTemplate, BarChart3, Shield, Brain, ShoppingBag, Package } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminNavCard from "@/components/admin/AdminNavCard";
import TimeRangeSelector from "@/components/admin/TimeRangeSelector";
import { useAuthSession } from "@/components/AuthSessionProvider";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkouts: number;
  totalSets: number;
}

const adminLinks = [
  { href: "/admin/exercises", title: "Exercises", desc: "Manage the standard exercise catalogue", icon: Dumbbell, color: "bg-[var(--primary-500)]" },
  { href: "/admin/form-rules", title: "Form Rules", desc: "Review AI-generated form checking rules", icon: Brain, color: "bg-[var(--primary-500)]" },
  { href: "/admin/users", title: "Users", desc: "View and manage user accounts and roles", icon: Users, color: "bg-[var(--primary-600)]" },
  { href: "/admin/templates", title: "Templates", desc: "Create and edit official workout templates", icon: LayoutTemplate, color: "bg-[var(--primary-700)]" },
  { href: "/admin/analytics", title: "Analytics", desc: "Platform-wide usage metrics and charts", icon: BarChart3, color: "bg-[var(--primary-400)]" },
  { href: "/admin/shop", title: "Shop", desc: "Add products and manage store inventory", icon: ShoppingBag, color: "bg-[var(--primary-800)]" },
  { href: "/admin/orders", title: "Orders", desc: "Review purchases and update fulfillment status", icon: Package, color: "bg-[var(--primary-500)]" },
];

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const { isAdmin, isAuthenticated } = useAuthSession();

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setStats(json.analytics);
      }
      setLoading(false);
    }
    if (isAdmin) {
      load();
    }
  }, [isAdmin, days]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  if (isAuthenticated && !isAdmin) return null;

  if (loading) {
    return (
      <div className="flex min-h-[18rem] w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <LoadReveal className="page-stack">
      <AdminPageHeader
        title="Platform overview"
        subtitle="Monitor activity and manage every operational area from one workspace."
      />

      <section className="space-y-5">
        <div className="section-header !mb-0">
          <div>
            <p className="eyebrow">Platform pulse</p>
            <h2 className="section-heading">Activity overview</h2>
          </div>
          <TimeRangeSelector value={days} onChange={setDays} />
        </div>
        {stats && (
          <div className="grid grid-cols-2 gap-3 mt-2 sm:gap-4 lg:grid-cols-4">
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
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="eyebrow">Management</p>
            <h2 className="section-heading">Admin tools</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
      </section>
    </LoadReveal>
  );
}
