"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Trash2,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { ConversationSummary } from "@/hooks/useAIChat";

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 288;

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onToggle,
  isMobile,
}: ConversationListProps) {
  const width = isMobile ? (isOpen ? EXPANDED_WIDTH : 0) : (isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 z-40 bg-black/40"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <motion.aside
        className={`
          flex flex-col bg-[var(--surface)] border-r border-[var(--border)]
          ${isMobile ? "fixed top-0 left-0 bottom-0 z-50" : "relative flex-shrink-0"}
        `}
        initial={false}
        animate={{ width }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ overflow: "hidden" }}
      >
        {/* Inner content: width matches outer so nothing is clipped */}
        <motion.div
          className="flex flex-col h-full"
          initial={false}
          animate={{ width: isMobile ? EXPANDED_WIDTH : width }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] flex-shrink-0">
            {isOpen ? (
              <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">
                Chats
              </h2>
            ) : (
              <div className="w-5" /> /* spacer */
            )}
            <div className="flex items-center gap-0.5">
              <button
                onClick={onNew}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                title={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {isOpen ? (
            /* Expanded: full conversation list */
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)] opacity-40" />
                  <p className="text-xs text-[var(--muted-foreground)]">No conversations yet</p>
                </div>
              ) : (
                <ul className="py-2">
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeId;
                    const date = new Date(conv.updatedAt);
                    const dateLabel = formatDateLabel(date);

                    return (
                      <li key={conv.id} className="px-2 py-0.5">
                        <div
                          className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                            ${
                              isActive
                                ? "bg-[var(--primary-100)] dark:bg-[var(--primary-900)]"
                                : "hover:bg-[var(--surface-raised)]"
                            }`}
                          onClick={() => {
                            onSelect(conv.id);
                          }}
                        >
                          <MessageSquare
                            className={`w-4 h-4 flex-shrink-0 ${
                              isActive
                                ? "text-[var(--primary-600)]"
                                : "text-[var(--muted-foreground)]"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isActive
                                  ? "text-[var(--primary-700)] dark:text-[var(--primary-300)]"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {conv.title}
                            </p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              {dateLabel}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--surface-raised)] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            /* Collapsed: icon buttons stacked vertically */
            <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <div key={conv.id} className="flex justify-center">
                    <button
                      onClick={() => onSelect(conv.id)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-[var(--primary-100)] dark:bg-[var(--primary-900)] text-[var(--primary-600)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
                      }`}
                      title={conv.title}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
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
