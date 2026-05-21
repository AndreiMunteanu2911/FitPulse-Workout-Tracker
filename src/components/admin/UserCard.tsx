import React from "react";
import { Dumbbell, Hash, Shield, Sparkles, User } from "lucide-react";
import Button from "@/components/Button";

interface UserCardProps {
  user_id: string;
  display_name: string | null;
  total_xp: number;
  level: number;
  workout_count: number;
  role: "client" | "admin";
  onChangeRole: () => void;
}

export default function UserCard({ user_id, display_name, total_xp, level, workout_count, role, onChangeRole }: UserCardProps) {
  const userName = display_name?.trim() || "Unnamed user";
  const initial = userName.charAt(0).toUpperCase();
  const shortId = `${user_id.slice(0, 8)}...${user_id.slice(-4)}`;
  const statItems = [
    { icon: <Hash className="h-3.5 w-3.5" />, label: shortId, title: user_id },
    { icon: <Sparkles className="h-3.5 w-3.5" />, label: `Level ${level}` },
    { icon: <Sparkles className="h-3.5 w-3.5" />, label: `${total_xp} XP` },
    { icon: <Dumbbell className="h-3.5 w-3.5" />, label: `${workout_count} workouts` },
  ];

  return (
    <div className="group rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--primary-200)] hover:bg-[var(--surface-raised)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-50)] text-base font-extrabold text-[var(--primary-700)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-600)]">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate text-base font-extrabold text-[var(--foreground)] sm:text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
                {userName}
              </h3>
              <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                role === "admin"
                  ? "bg-[var(--primary-500)] text-white"
                  : "bg-[var(--primary-50)] text-[var(--primary-700)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-600)]"
              }`}>
                {role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {role}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
              {statItems.map((item) => (
                <span
                  key={item.label}
                  title={item.title}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--surface-raised)] px-2.5 py-1 font-medium"
                >
                  {item.icon}
                  <span className={item.title ? "truncate font-mono" : ""}>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={onChangeRole} className="w-full rounded-full sm:w-auto">
          Change Role
        </Button>
      </div>
    </div>
  );
}
