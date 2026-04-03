"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import MessageBubble, { WorkoutActionCard } from "@/components/ai/MessageBubble";
import QuickSuggestions from "@/components/ai/QuickSuggestions";

export default function AICoachPage() {
  const router = useRouter();
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-100)] dark:bg-[var(--primary-900)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">AI Coach</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Powered by your workout data
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-[var(--primary-100)] dark:bg-[var(--primary-900)] flex items-center justify-center mb-6"
            >
              <Sparkles className="w-10 h-10 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
            </motion.div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
              Your AI Fitness Coach
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-8 leading-relaxed">
              I have access to your entire workout history, personal records,
              volume trends, and muscle recovery status. Ask me anything about
              your training, or request a custom workout.
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
              />
            ))}

            {lastWorkoutAction && (
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
        className="px-4 py-4 border-t border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2">
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
              transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
