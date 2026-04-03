"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Send, Trash2, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import MessageBubble, { WorkoutActionCard } from "@/components/ai/MessageBubble";
import QuickSuggestions from "@/components/ai/QuickSuggestions";
import ConversationList from "@/components/ai/ConversationList";

export default function AICoachPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile mode on mount and resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearConversation,
    lastWorkoutAction,
    conversationId,
    conversations,
    loadConversation,
    newConversation,
    fetchConversations,
    deleteConversation,
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation list on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (lastWorkoutAction) {
      router.push(`/workout`);
    }
  };

  const handleWorkoutRecreate = () => {
    if (lastWorkoutAction) {
      sendMessage(`Recreate the same workout: ${lastWorkoutAction.name}`);
    }
  };

  const handleNewConversation = () => {
    newConversation();
    fetchConversations();
  };

  // Check if the loaded conversation has expired workout data
  const lastMessage = messages[messages.length - 1];
  const hasExpiredWorkout = (() => {
    if (!lastMessage?.createdAt) return false;
    const age = Date.now() - new Date(lastMessage.createdAt).getTime();
    return age > 24 * 60 * 60 * 1000; // 24 hours
  })();

  return (
    // Negative margins cancel out <main>'s padding so the panel fills edge-to-edge.
    // -mb-24 / md:-mb-8 cancel the bottom padding so the page doesn't scroll.
    // Height: mobile = 100dvh minus TopBar spacer (2.75rem) minus bottom nav (~4.25rem)
    //         desktop = full viewport (no topbar, no bottom nav)
    <div className="-mx-4 -mt-4 -mb-24 md:-mx-8 md:-mt-6 md:-mb-8 flex h-[calc(100dvh-7rem)] md:h-screen overflow-hidden">
      {/* Conversation List (toggle-controlled drawer, 0 → 260 px) */}
      <ConversationList
        conversations={conversations}
        activeId={conversationId}
        onSelect={(id) => loadConversation(id)}
        onNew={handleNewConversation}
        onDelete={(id) => deleteConversation(id)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle — always visible, opens/closes the drawer */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
              title={isSidebarOpen ? "Close chat history" : "Open chat history"}
            >
              {isSidebarOpen
                ? <PanelLeftClose className="w-5 h-5" />
                : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 rounded-xl bg-[var(--primary-100)] dark:bg-[var(--primary-900)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--foreground)] leading-tight">AI Coach</h1>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                {conversationId ? "Loaded conversation" : "Powered by your workout data"}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
              title="New conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl bg-[var(--primary-100)] dark:bg-[var(--primary-900)] flex items-center justify-center mb-4"
              >
                <Sparkles className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
              </motion.div>
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
                Your AI Fitness Coach
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-5 leading-relaxed">
                I know your workout history, PRs, and volume trends. Ask anything or request a workout.
              </p>
              <QuickSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
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
                  isExpired={hasExpiredWorkout && msg.role === "assistant" && lastWorkoutAction !== null}
                  onWorkoutRecreate={handleWorkoutRecreate}
                  workoutName={hasExpiredWorkout && lastWorkoutAction ? lastWorkoutAction.name : undefined}
                  workoutExercises={hasExpiredWorkout && lastWorkoutAction ? lastWorkoutAction.exercises.map((ex) => ({
                    name: ex.name,
                    sets: ex.sets,
                  })) : undefined}
                />
              ))}

              {!hasExpiredWorkout && lastWorkoutAction && (
                <WorkoutActionCard
                  workoutName={lastWorkoutAction.name}
                  exercises={lastWorkoutAction.exercises.map((ex) => ({
                    name: ex.name,
                    sets: ex.sets,
                  }))}
                  onStart={handleWorkoutStart}
                />
              )}

              {error && (
                <div className="text-sm text-[var(--color-destructive)] text-center py-2">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your training, request a workout..."
              disabled={isStreaming}
              className="flex-1 px-4 py-3 rounded-xl text-sm
                bg-[var(--surface-raised)] text-[var(--foreground)]
                placeholder-[var(--muted-foreground)]
                focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]
                disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className="w-12 h-12 rounded-xl flex items-center justify-center
                bg-[var(--primary-600)] hover:bg-[var(--primary-700)]
                text-white disabled:opacity-40 disabled:pointer-events-none
                transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
