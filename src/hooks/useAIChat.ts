// ── AI Chat Hook ─────────────────────────────────────────────────────────────
// Manages conversation state, SSE streaming, workout action detection,
// and persistence to Supabase via API routes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  clientId: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExerciseSummary {
  exerciseId?: string;
  name: string;
  sets: { reps: number; weight: number }[];
}

export interface WorkoutAction {
  type: "workout_created";
  workoutId?: string;
  name: string;
  exercises: WorkoutExerciseSummary[];
}

function toWorkoutAction(value: unknown): WorkoutAction | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  if (data.action !== "workout_created") return null;
  if (typeof data.name !== "string") return null;

  return {
    type: "workout_created",
    workoutId: typeof data.workoutId === "string" ? data.workoutId : undefined,
    name: data.name,
    exercises: Array.isArray(data.exercises)
      ? data.exercises as WorkoutExerciseSummary[]
      : [],
  };
}

function stripToolCallText(content: string): string {
  return content
    .replace(/<\|tool_call_start\|>[\s\S]*?(?:<\|tool_call_end\|>|$)/g, "")
    .replace(/\[created_workout\([^\]]*\)\]/g, "")
    .trim();
}

function extractWorkoutAction(content: string): {
  content: string;
  action: WorkoutAction | null;
} {
  let action: WorkoutAction | null = null;
  const visibleLines: string[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("{") && trimmed.includes('"workout_created"')) {
      try {
        const parsedAction = toWorkoutAction(JSON.parse(trimmed));
        if (parsedAction) {
          action = parsedAction;
          continue;
        }
      } catch {
        // Keep malformed or incomplete JSON out of the visible chat while streaming.
        continue;
      }
    }

    visibleLines.push(line);
  }

  return {
    content: stripToolCallText(visibleLines.join("\n")),
    action,
  };
}

function workoutActionMarker(action: WorkoutAction): string {
  return JSON.stringify({
    action: "workout_created",
    workoutId: action.workoutId,
    name: action.name,
    exercises: action.exercises,
  });
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  lastWorkoutAction: WorkoutAction | null;
  // Conversation history
  conversationId: string | null;
  conversations: ConversationSummary[];
  loadConversation: (id: string) => Promise<void>;
  newConversation: () => void;
  fetchConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWorkoutAction, setLastWorkoutAction] = useState<WorkoutAction | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const assistantIdxRef = useRef<number>(-1);
  // Track messages since last save to avoid duplicates
  const savedCountRef = useRef<number>(0);

  // ── Save messages to DB ─────────────────────────────────────────────────
  const saveMessagesToDB = useCallback(async (convId: string, msgs: ChatMessage[]) => {
    const unsaved = msgs.slice(savedCountRef.current);
    if (unsaved.length === 0) return;

    try {
      await fetch("/api/ai/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          messages: unsaved.map((m) => ({ clientId: m.clientId, role: m.role, content: m.content })),
        }),
      });
      savedCountRef.current = msgs.length;
    } catch {
      // Silently fail — messages are still in UI
    }
  }, []);

  // ── Create conversation ─────────────────────────────────────────────────
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    try {
      const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + "…" : firstMessage;
      const tempId = crypto.randomUUID();

      // Optimistic: set ID and add to list immediately
      setConversationId(tempId);
      setConversations((prev) => [{ id: tempId, title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);

      // Persist in background
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const id = data.conversation?.id;
      if (id && id !== tempId) {
        setConversationId(id);
        setConversations((prev) => prev.map((c) => c.id === tempId ? { ...c, id } : c));
      }
      return id;
    } catch {
      return null;
    }
  }, []);

  // ── Fetch conversation list ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations((data.conversations ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        title: c.title as string,
        createdAt: c.created_at as string,
        updatedAt: c.updated_at as string,
      })));
    } catch {
      // Silently fail
    }
  }, []);

  // ── Load a past conversation ─────────────────────────────────────────────
  const loadConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      let loadedWorkoutAction: WorkoutAction | null = null;
      const loadedMessages: ChatMessage[] = (data.messages ?? []).map((m: Record<string, unknown>) => {
        const role = m.role as "user" | "assistant";
        const rawContent = m.content as string;
        const extracted = role === "assistant"
          ? extractWorkoutAction(rawContent)
          : { content: rawContent, action: null };

        if (extracted.action) {
          loadedWorkoutAction = extracted.action;
        }

        return {
          clientId: typeof m.client_id === "string" ? m.client_id : crypto.randomUUID(),
          role,
          content: extracted.content,
          createdAt: m.created_at as string,
        };
      });
      setMessages(loadedMessages);
      setConversationId(id);
      savedCountRef.current = loadedMessages.length;
      setLastWorkoutAction(loadedWorkoutAction);
      setError(null);
      setIsStreaming(false);
    } catch {
      // Silently fail
    }
  }, []);

  // ── Start fresh conversation ────────────────────────────────────────────
  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    savedCountRef.current = 0;
    setError(null);
    setLastWorkoutAction(null);
    setIsStreaming(false);
  }, []);

  // ── Delete a conversation ───────────────────────────────────────────────
  const deleteConversation = useCallback(async (id: string) => {
    // Optimistic: remove from list immediately
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (conversationId === id) {
      newConversation();
    }

    // Persist in background
    try {
      await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
    } catch {
      // Silently fail
    }
  }, [conversationId, newConversation]);

  // ── Clear (alias for newConversation) ───────────────────────────────────
  const clearConversation = useCallback(() => {
    newConversation();
  }, [newConversation]);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;

    // Auto-create conversation on first message
    let convId = conversationId;
    if (!convId && messages.length === 0) {
      convId = await createConversation(message.trim());
    }

    const currentLength = messages.length;
    const userMsg: ChatMessage = { clientId: crypto.randomUUID(), role: "user", content: message.trim() };
    const assistantClientId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg]);

    const assistantIdx = currentLength + 1;
    assistantIdxRef.current = assistantIdx;
    setMessages((prev) => [...prev, { clientId: assistantClientId, role: "assistant", content: "" }]);
    setIsStreaming(true);
    setError(null);
    setLastWorkoutAction(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const conversationHistory = messages.slice(-10);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory,
          conversationId: convId,
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

            if (parsed.error) {
              setError(parsed.error);
              continue;
            }

            if (parsed.action === "workout_created") {
              workoutAction = toWorkoutAction(parsed);
              continue;
            }

            if (parsed.delta) {
              fullContent += parsed.delta;

              const extracted = extractWorkoutAction(fullContent);
              if (extracted.action) {
                workoutAction = extracted.action;
              }
              const visibleContent = extracted.content;

              const idx = assistantIdxRef.current;
              if (idx >= 0) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[idx] = {
                    ...updated[idx],
                    content: visibleContent,
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
        const extracted = extractWorkoutAction(fullContent);
        const visibleContent = extracted.content ||
          `I prepared "${workoutAction.name}" for you. Click Start Workout when you want me to create it.`;
        fullContent = visibleContent;

        const idx = assistantIdxRef.current;
        if (idx >= 0) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              content: visibleContent,
            };
            return updated;
          });
        }

        setLastWorkoutAction(workoutAction);
      }

      if (!fullContent && !workoutAction) {
        const idx = assistantIdxRef.current;
        if (idx >= 0) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              role: "assistant",
              content: "I wasn't able to generate a response. Please try again.",
            };
            return updated;
          });
        }
      }

      // Save to DB
      if (convId) {
        // Get the final messages state
        const assistantContent = workoutAction
          ? `${fullContent}\n${workoutActionMarker(workoutAction)}`
          : fullContent || "I wasn't able to generate a response.";
        const finalMsgs = [
          ...messages,
          userMsg,
          { clientId: assistantClientId, role: "assistant" as const, content: assistantContent },
        ];
        await saveMessagesToDB(convId, finalMsgs);
        await fetchConversations();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred");

      const idx = assistantIdxRef.current;
      if (idx >= 0) {
        setMessages((prev) => prev.filter((_, i) => i !== idx));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming, conversationId, createConversation, saveMessagesToDB, fetchConversations]);

  return {
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
  };
}
