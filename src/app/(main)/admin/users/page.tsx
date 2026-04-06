'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import UserCard from "@/components/admin/UserCard";
import RoleChangeModal from "@/components/admin/RoleChangeModal";

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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");

  // Role change modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [changingUser, setChangingUser] = useState<UserInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) { router.push("/login"); return; }
      const session = await sessionRes.json();
      if (session.user?.role !== "admin") { router.push("/dashboard"); return; }
      setIsAdmin(true);
    }
    checkAdmin();
  }, [router]);

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

  const openRoleChange = (user: UserInfo) => {
    setChangingUser(user);
    setError("");
    setShowRoleModal(true);
  };

  const handleRoleChange = async (newRole: "client" | "admin") => {
    if (!changingUser) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${changingUser.user_id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to change role");
        setSaving(false);
        return;
      }

      setShowRoleModal(false);
      fetchUsers();
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  if (!isAdmin || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size={40} />
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
