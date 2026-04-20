'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import UserCard from "@/components/admin/UserCard";
import RoleChangeModal from "@/components/admin/RoleChangeModal";
import { useAuthSession } from "@/components/AuthSessionProvider";

interface UserInfo {
  user_id: string;
  total_xp: number;
  level: number;
  streak_freeze_count: number;
  role: "client" | "admin";
  workout_count: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { isAdmin, isAuthenticated } = useAuthSession();

  // Role change modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [changingUser, setChangingUser] = useState<UserInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  const openRoleChange = (user: UserInfo) => {
    setChangingUser(user);
    setError("");
    setShowRoleModal(true);
  };

  const handleRoleChange = async (newRole: "client" | "admin") => {
    if (!changingUser) return;
    setSaving(true);
    setError("");
    const userId = changingUser.user_id;
    const oldRole = changingUser.role;

    // Optimistic: update role immediately
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: newRole } : u));
    setShowRoleModal(false);
    setSaving(false);

    // Persist in background
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const json = await res.json();
        setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: oldRole } : u));
        setError(json.error || "Failed to change role");
      }
    } catch {
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: oldRole } : u));
      setError("Network error");
    }
  };

  if (isAuthenticated && !isAdmin) return null;

  if (!isAdmin || loading) {
    return (
      <div className="w-full">
        <div className="page-header mb-6">
          <Skeleton width={120} height={28} className="mb-2" />
          <Skeleton width={160} />
        </div>
        <Skeleton height={40} className="mb-6 rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={70} className="rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = search.trim()
    ? users.filter((u) => u.user_id.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Admin — Users"
        subtitle="View and manage user accounts"
        backHref="/admin"
      />

      {/* Search */}
      <div className="relative mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by user ID..." />
      </div>

      {/* User List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<User className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />}
          title="No users found"
          description={search ? "Try a different search." : "No users have signed up yet."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <UserCard
              key={u.user_id}
              user_id={u.user_id}
              total_xp={u.total_xp}
              level={u.level}
              workout_count={u.workout_count}
              role={u.role}
              onChangeRole={() => openRoleChange(u)}
            />
          ))}
        </div>
      )}

      {/* Role Change Modal */}
      {changingUser && (
        <RoleChangeModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          userId={changingUser.user_id}
          currentRole={changingUser.role}
          onConfirm={handleRoleChange}
          error={error}
          loading={saving}
        />
      )}
    </div>
  );
}
