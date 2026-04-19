"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, WorkoutAction, WorkoutExerciseSummary } from "@/hooks/useAIChat";
import { Sparkles } from "lucide-react";
import MessageBubble, { WorkoutActionCard } from "./MessageBubble";

interface CoachTextWindowProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  lastWorkoutAction: WorkoutAction | null;
  onWorkoutStart: () => void;
  onWorkoutRecreate: () => void;
  onSuggestionClick: (message: string) => void;
  suggestions: { icon: typeof Sparkles; label: string; message: string }[];
}

const EXPIRY_MS = 24 * 60 * 60 * 1000;

export default function CoachTextWindow({
  messages,
  isStreaming,
  error,
  lastWorkoutAction,
  onWorkoutStart,
  onWorkoutRecreate,
  onSuggestionClick,
  suggestions,
}: CoachTextWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastMsg = messages[messages.length - 1];
  const hasExpired = (() => {
    if (!lastMsg?.createdAt) return false;
    return Date.now() - new Date(lastMsg.createdAt).getTime() > EXPIRY_MS;
  })();

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Your AI Fitness Coach</h2>
          <p className="text-base text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Ask about your training progress, get recommendations, or request a custom workout.
          </p>
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s.message)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium
                  bg-[var(--surface-raised)] text-[var(--foreground)]
                  border border-[var(--border)]
                  hover:border-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-950)]
                  transition-colors"
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
              isExpired={hasExpired && msg.role === "assistant" && lastWorkoutAction !== null}
              onWorkoutRecreate={onWorkoutRecreate}
              workoutName={hasExpired && lastWorkoutAction ? lastWorkoutAction.name : undefined}
              workoutExercises={hasExpired && lastWorkoutAction ? lastWorkoutAction.exercises.map((ex: WorkoutExerciseSummary) => ({ name: ex.name, sets: ex.sets })) : undefined}
            />
          ))}

          {!hasExpired && lastWorkoutAction && (
            <WorkoutActionCard
              workoutName={lastWorkoutAction.name}
              exercises={lastWorkoutAction.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets,
              }))}
              onStartAction={onWorkoutStart}
            />
          )}

          {error && (
            <div className="text-sm text-[var(--color-destructive)] text-center py-2">{error}</div>
          )}

          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}
