"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Dumbbell, Brain, Scale, Zap } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import CoachSidebar from "@/components/ai/CoachSidebar";
import CoachTextWindow from "@/components/ai/CoachTextWindow";
import CoachTextArea from "@/components/ai/CoachTextArea";

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

  const handleWorkoutStart = () => {
    if (lastWorkoutAction) router.push("/workout");
  };

  const handleWorkoutRecreate = () => {
    if (lastWorkoutAction) sendMessage(`Recreate the same workout: ${lastWorkoutAction.name}`);
  };

  return (
    <div className="w-full">
      {/* Page header — matches all other pages */}
      <div className="page-header mb-6">
        <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">AI Coach</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          {conversationId ? "Loaded conversation" : "Powered by your workout data"}
        </p>
      </div>

      {/* Layout: chat panel (left) + sidebar (right, desktop only) */}
      <div className="flex gap-4 h-[calc(100vh-14rem)] flex-row-reverse">
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
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)] rounded-xl overflow-hidden">
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
