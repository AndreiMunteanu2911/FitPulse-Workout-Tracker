"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Dumbbell, Brain, Scale, Zap } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import CoachSidebar from "@/components/ai/CoachSidebar";
import CoachTextWindow from "@/components/ai/CoachTextWindow";
import CoachTextArea from "@/components/ai/CoachTextArea";
import { apiFetch } from "@/services/api/apiFetch";
import { PageHeader } from "@/components/PageHeader";

const SUGGESTIONS = [
  { icon: TrendingUp, label: "How's my bench press progressing?", message: "How's my bench press progressing?" },
  { icon: Dumbbell, label: "Create a push day workout", message: "Create a push day workout for me" },
  { icon: Brain, label: "What should I train today?", message: "What should I train today based on my recent workouts?" },
  { icon: Scale, label: "Compare my squat vs deadlift", message: "Compare my squat and deadlift progress" },
  { icon: Zap, label: "Am I overtraining?", message: "Am I overtraining? Look at my recent volume and frequency" },
];

export default function AICoachPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    setInputValue("");
    sendMessage(trimmed);
  };

  const handleWorkoutStart = async () => {
    if (!lastWorkoutAction) return;

    await apiFetch("/api/workouts/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lastWorkoutAction.name,
        exercises: lastWorkoutAction.exercises,
      }),
    });
    router.push("/workout");
  };

  const handleWorkoutRecreate = () => {
    if (lastWorkoutAction) sendMessage(`Recreate the same workout: ${lastWorkoutAction.name}`);
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      {/* Page header — matches all other pages */}
      <PageHeader
        title="AI Coach"
        description={conversationId ? "Continue your selected conversation." : "Get guidance based on your workout data."}
      />

      {/* Layout: chat panel (left) + sidebar (right, desktop only) */}
      <div className="flex h-[calc(100dvh-13rem)] min-h-[32rem] max-h-[52rem] min-w-0 flex-row-reverse gap-4">
        {/* Sidebar — right side, desktop only */}
        <CoachSidebar
          conversations={conversations}
          activeId={conversationId}
          onSelect={(id) => loadConversation(id)}
          onNew={() => { newConversation(); fetchConversations(); }}
          onDelete={(id) => deleteConversation(id)}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Chat panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <CoachTextWindow
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            lastWorkoutAction={lastWorkoutAction}
            onWorkoutStart={handleWorkoutStart}
            onWorkoutRecreate={handleWorkoutRecreate}
            onSuggestionClick={(msg) => sendMessage(msg)}
            suggestions={SUGGESTIONS}
          />
          <CoachTextArea
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
