import { User } from "lucide-react";

interface UserAvatarProps {
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
  xl: "size-20 text-2xl",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserAvatar({ name, size = "md", className = "" }: UserAvatarProps) {
  const initials = getInitials(name || "");

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] font-extrabold text-white shadow-[0_10px_24px_rgba(116,87,245,0.22)] ${sizeClasses[size]} ${className}`}
      aria-label={name || "User"}
    >
      {initials || <User className="size-[38%]" />}
    </div>
  );
}
