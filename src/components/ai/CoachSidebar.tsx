"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, PanelLeftOpen } from "lucide-react";
import type { ConversationSummary } from "@/hooks/useAIChat";

interface CoachSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const EXPANDED = 260;
const COLLAPSED = 56;

/** Hook that ticks every second and returns the latest "time ago" labels */
function useRelativeTimes(updatedAts: string[]): string[] {
  const [, setTick] = useState(0);
  const saved = useRef(updatedAts);
  saved.current = updatedAts;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000); // update every 30s
    return () => clearInterval(id);
  }, []);

  return saved.current.map((d) => formatDateLabel(new Date(d)));
}

export default function CoachSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onToggle,
}: CoachSidebarProps) {
  const labels = useRelativeTimes(conversations.map((c) => c.updatedAt));

  return (
    <motion.aside
      className="hidden lg:flex lg:flex-col lg:bg-[var(--surface)] lg:rounded-2xl lg:border lg:border-[var(--border)] lg:overflow-hidden lg:flex-shrink-0"
      initial={false}
      animate={{ width: isOpen ? EXPANDED : COLLAPSED }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{ overflow: "hidden" }}
    >
      {/* Inner wrapper: fixed 260px. Header items positioned at LEFT so always visible. */}
      <div className="flex flex-col h-full" style={{ width: EXPANDED }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] flex-shrink-0">
          {/* Hamburger toggle — always at left edge, always visible */}
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
            title={isOpen ? "Collapse" : "Expand"}
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          {/* Title — fades in/out */}
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.h2
                key="title"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold text-[var(--foreground)] truncate"
              >
                Chats
              </motion.h2>
            )}
          </AnimatePresence>

          {/* Spacer */}
          <div className="flex-1" />

          {/* + button — only shown when expanded */}
          <AnimatePresence>
            {isOpen && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                onClick={onNew}
                className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Content — only rendered when expanded */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)] opacity-40" />
                <p className="text-xs text-[var(--muted-foreground)]">No conversations yet</p>
              </div>
            ) : (
              <ul className="py-2">
                {conversations.map((conv, i) => {
                  const isActive = conv.id === activeId;
                  return (
                    <li key={conv.id} className="px-2 py-0.5">
                      <div
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm
                          ${isActive ? "bg-[var(--primary-100)] dark:bg-[var(--primary-900)]" : "hover:bg-[var(--surface-raised)]"}`}
                        onClick={() => onSelect(conv.id)}
                      >
                        <div className="w-3.5 h-3.5 flex-shrink-0 rounded-sm bg-[var(--primary-600)]/20 flex items-center justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[var(--primary-600)]" : "bg-[var(--muted-foreground)]"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isActive ? "text-[var(--primary-700)] dark:text-[var(--primary-300)]" : "text-[var(--foreground)]"}`}>
                            {conv.title}
                          </p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">{labels[i]}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </motion.aside>
  );
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  if (isNaN(diffMs)) return "";
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
