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

/** Ticks every 30s so relative time labels update in real time */
function useRelativeTimes(updatedAts: string[]): string[] {
  const [, setTick] = useState(0);
  const saved = useRef(updatedAts);
  saved.current = updatedAts;
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
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
    <>
      {/* ── Mobile pill button ─────────────────────────────── */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 right-4 z-30 w-10 h-10 rounded-full
          bg-[var(--surface)] border border-[var(--border)] shadow-md
          flex items-center justify-center text-[var(--foreground)]
          active:scale-95 transition-transform"
        aria-label="Chat history"
      >
        <PanelLeftOpen className="w-4 h-4" />
      </button>

      {/* ── Mobile backdrop ────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            onClick={onToggle}
            className="lg:hidden fixed inset-0 z-40 bg-black/40"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ──────────────────────────────────── */}
      <motion.aside
        className={`
          flex flex-col bg-[var(--surface)] border-[var(--border)] overflow-hidden
          lg:hidden
          ${isOpen ? "lg:flex" : "lg:hidden"}
          fixed top-0 right-0 bottom-0 z-50 border-l
        `}
        initial={false}
        animate={{ x: isOpen ? 0 : 288 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ width: EXPANDED }}
      >
        {/* Inner wrapper */}
        <div className="flex flex-col h-full" style={{ width: EXPANDED }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
              title="Close"
            >
              <PanelLeftOpen className="w-4 h-4 rotate-180" />
            </button>
            <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">Chats</h2>
            <div className="flex-1" />
            <button
              onClick={() => { onNew(); onToggle(); }}
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
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
                        onClick={() => { onSelect(conv.id); onToggle(); }}
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
        </div>
      </motion.aside>

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <motion.aside
        className="hidden lg:flex lg:flex-col lg:bg-[var(--surface)] lg:rounded-2xl lg:border lg:border-[var(--border)] lg:overflow-hidden lg:flex-shrink-0"
        initial={false}
        animate={{ width: isOpen ? EXPANDED : COLLAPSED }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <div className="flex flex-col h-full" style={{ width: EXPANDED }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
              title={isOpen ? "Collapse" : "Expand"}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.h2
                  key="title"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="text-sm font-semibold text-[var(--foreground)] truncate"
                >
                  Chats
                </motion.h2>
              )}
            </AnimatePresence>
            <div className="flex-1" />
            <AnimatePresence>
              {isOpen && (
                <motion.button
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  onClick={onNew}
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
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
    </>
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
