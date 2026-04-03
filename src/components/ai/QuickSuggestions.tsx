"use client";

import { motion } from "framer-motion";
import { TrendingUp, Dumbbell, CalendarDays, Activity } from "lucide-react";
import { useState } from "react";

interface QuickSuggestionsProps {
  onSuggestionClick: (message: string) => void;
}

const SUGGESTIONS = [
  {
    icon: TrendingUp,
    label: "How's my bench press progressing?",
    message: "How's my bench press progressing?",
  },
  {
    icon: Dumbbell,
    label: "Create a push day workout",
    message: "Create a push day workout for me",
  },
  {
    icon: CalendarDays,
    label: "What should I train today?",
    message: "What should I train today based on my recent workouts?",
  },
  {
    icon: Activity,
    label: "Am I overtraining?",
    message: "Am I overtraining? Look at my recent volume and frequency",
  },
];

export default function QuickSuggestions({
  onSuggestionClick,
}: QuickSuggestionsProps) {
  const [used, setUsed] = useState<Set<number>>(new Set());

  const handleClick = (index: number, message: string) => {
    setUsed((prev) => new Set(prev).add(index));
    onSuggestionClick(message);
  };

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {SUGGESTIONS.map((s, i) => {
        const isUsed = used.has(i);
        const Icon = s.icon;
        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: isUsed ? 0.3 : 1,
              scale: isUsed ? 0.95 : 1,
            }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => handleClick(i, s.message)}
            disabled={isUsed}
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left
              bg-[var(--surface-raised)] text-[var(--foreground)]
              border border-[var(--border)]
              hover:border-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-950)]
              disabled:pointer-events-none disabled:opacity-30
              transition-colors"
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
            <span className="leading-snug">{s.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
