// ── AI Chat Hook ─────────────────────────────────────────────────────────────
// Manages conversation state, SSE streaming, and workout action detection.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WorkoutExerciseSummary {
  name: string;
  sets: { reps: number; weight: number }[];
}

export interface WorkoutAction {
  type: "workout_created";
  workoutId: string;
  name: string;
  exercises: WorkoutExerciseSummary[];
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  lastWorkoutAction: WorkoutAction | null;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWorkoutAction, setLastWorkoutAction] = useState<WorkoutAction | null>(null);

  // Abort controller to cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);
  // Track the current assistant message index
  const assistantIdxRef = useRef<number>(-1);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;

    // Capture current message length for index calculation
    const currentLength = messages.length;

    // Add user message immediately
    const userMsg: ChatMessage = { role: "user", content: message.trim() };
    setMessages((prev) => [...prev, userMsg]);

    // Create a placeholder assistant message that we'll stream into
    const assistantIdx = currentLength + 1;
    assistantIdxRef.current = assistantIdx;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsStreaming(true);
    setError(null);
    setLastWorkoutAction(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // Build conversation history (last 10 messages for context window)
      const conversationHistory = messages.slice(-10);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error ?? `Request failed with status ${res.status}`,
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let workoutAction: WorkoutAction | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);

            // Check for error
            if (parsed.error) {
              setError(parsed.error);
              continue;
            }

            // Check for workout action (appended at end of stream)
            if (parsed.action === "workout_created") {
              workoutAction = {
                type: "workout_created",
                workoutId: parsed.workoutId,
                name: parsed.name,
                exercises: parsed.exercises ?? [],
              };
              continue;
            }

            // Normal text delta
            if (parsed.delta) {
              fullContent += parsed.delta;

              // Check if the content ends with a JSON action block
              const actionMatch = fullContent.match(
                /\n\{"action":\s*"workout_created"/,
              );
              if (actionMatch) {
                // Extract the JSON
                const jsonStr = fullContent.slice(actionMatch.index);
                try {
                  const actionData = JSON.parse(jsonStr.trim());
                  if (actionData.action === "workout_created") {
                    workoutAction = {
                      type: "workout_created",
                      workoutId: actionData.workoutId,
                      name: actionData.name,
                      exercises: actionData.exercises ?? [],
                    };
                    // Remove the JSON from the displayed content
                    fullContent = fullContent.slice(0, actionMatch.index).trim();
                  }
                } catch {
                  // Incomplete JSON, wait for more data
                }
              }

              // Update the assistant message using the captured index
              const idx = assistantIdxRef.current;
              if (idx >= 0) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[idx] = {
                    ...updated[idx],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      if (workoutAction) {
        setLastWorkoutAction(workoutAction);
      }

      // If content is still empty after streaming, show a fallback
      if (!fullContent && !workoutAction) {
        const idx = assistantIdxRef.current;
        if (idx >= 0) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[idx] = {
              role: "assistant",
              content: "I wasn't able to generate a response. Please try again.",
            };
            return updated;
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred");

      // Remove the empty assistant message on error
      const idx = assistantIdxRef.current;
      if (idx >= 0) {
        setMessages((prev) => prev.filter((_, i) => i !== idx));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setLastWorkoutAction(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearConversation,
    lastWorkoutAction,
  };
}
