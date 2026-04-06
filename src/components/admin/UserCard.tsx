import React from "react";
import { Shield, User } from "lucide-react";
import Button from "@/components/Button";

interface UserCardProps {
  user_id: string;
  total_xp: number;
  level: number;
  workout_count: number;
  role: "client" | "admin";
  onChangeRole: () => void;
}

export default function UserCard({ user_id, total_xp, level, workout_count, role, onChangeRole }: UserCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-base font-bold text-[var(--foreground)] font-mono truncate">{user_id.slice(0, 18)}...</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              role === "admin"
                ? "bg-[var(--primary-500)] text-white"
                : "bg-[var(--primary-50)] text-[var(--primary-700)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-600)]"
            }`}>
              {role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {role}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span>Level {level}</span>
            <span>{total_xp} XP</span>
            <span>{workout_count} workouts</span>
          </div>
        </div>
        <Button variant="secondary" onClick={onChangeRole}>
          Change Role
        </Button>
      </div>
    </div>
  );
}
