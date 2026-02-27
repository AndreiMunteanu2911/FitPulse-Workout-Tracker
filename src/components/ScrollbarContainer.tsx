import { type ReactNode } from "react";

interface ScrollbarContainerProps {
  children: ReactNode;
  className?: string;
  horizontal?: boolean;
}

export default function ScrollbarContainer({ children, className = "", horizontal = false }: ScrollbarContainerProps) {
  const base = horizontal ? "flex overflow-x-auto py-2 px-4" : "grow min-h-0 overflow-auto py-2 px-4";
  const behaviour = "[scrollbar-gutter:stable_both-edges] [overscroll-behavior:contain]";
  const firefox = "[scrollbar-color:var(--primary-500)_transparent] [scrollbar-width:thin]";
  const webkit =
    "[&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--primary-500)] [&::-webkit-scrollbar-thumb:hover]:bg-[var(--primary-400)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full";
  return <div className={[base, behaviour, firefox, webkit, className].join(" ")}>{children}</div>;
}
