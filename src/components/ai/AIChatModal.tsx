"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
} from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import MessageBubble, { WorkoutActionCard } from "./MessageBubble";
import QuickSuggestions from "./QuickSuggestions";

interface AIChatModalProps {
  onWorkoutStart?: (workoutId: string) => void;
}

export default function AIChatModal({ onWorkoutStart }: AIChatModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearConversation,
    lastWorkoutAction,
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle workout action — NO auto-redirect, user must click "Start Workout"
  useEffect(() => {
    // Intentionally empty — only manual navigation via button click
  }, [lastWorkoutAction]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    setInputValue("");
    sendMessage(trimmed);
  };

  const handleSuggestionClick = (message: string) => {
    sendMessage(message);
  };

  const handleWorkoutStart = () => {
    if (lastWorkoutAction && onWorkoutStart) {
      onWorkoutStart(lastWorkoutAction.workoutId);
    }
  };

  return (
    <>
      {/* Floating FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full
          bg-[var(--primary-600)] hover:bg-[var(--primary-700)]
          text-white shadow-[var(--shadow)] flex items-center justify-center
          transition-colors"
        aria-label="Open AI Coach"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed z-50 bg-[var(--surface)] border-t border-[var(--border)]
                flex flex-col
                md:right-6 md:bottom-24 md:rounded-xl md:border md:shadow-[var(--shadow-md)]
                ${
                  isExpanded
                    ? "inset-0 md:inset-auto md:w-[500px] md:h-[700px] md:max-h-[calc(100vh-6rem)]"
                    : "bottom-0 left-0 right-0 h-[85vh] md:h-[500px] md:w-[400px]"
                }
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--primary-600)]" />
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">
                    AI Coach
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearConversation}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                      title="Clear conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                    title={isExpanded ? "Minimize" : "Maximize"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-xl bg-[var(--primary-100)] dark:bg-[var(--primary-900)] flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                      Ask me anything about your training
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-xs">
                      I have access to your workout history, PRs, and progress.
                      Ask about your progress, get recommendations, or create workouts.
                    </p>
                    <QuickSuggestions onSuggestionClick={handleSuggestionClick} />
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble
                        key={i}
                        role={msg.role}
                        content={msg.content}
                        isStreaming={
                          isStreaming &&
                          i === messages.length - 1 &&
                          msg.role === "assistant"
                        }
                      />
                    ))}

                    {/* Workout Action Card */}
                    {lastWorkoutAction && (
                      <WorkoutActionCard
                        workoutName={lastWorkoutAction.name}
                        exercises={lastWorkoutAction.exercises.map((ex) => ({
                          name: ex.name,
                          sets: ex.sets,
                        }))}
                        onStartAction={handleWorkoutStart}
                      />
                    )}

                    {/* Error */}
                    {error && (
                      <div className="text-sm text-[var(--color-destructive)] text-center py-2">
                        {error}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="px-4 py-3 border-t border-[var(--border)] flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your training..."
                  disabled={isStreaming}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm
                    bg-[var(--surface-raised)] text-[var(--foreground)]
                    placeholder-[var(--muted-foreground)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]
                    disabled:opacity-50 transition"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="w-10 h-10 rounded-lg flex items-center justify-center
                    bg-[var(--primary-600)] hover:bg-[var(--primary-700)]
                    text-white disabled:opacity-40 disabled:pointer-events-none
                    transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
