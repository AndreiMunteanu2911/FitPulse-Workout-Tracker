"use client";

import { useRef } from "react";
import { Send } from "lucide-react";

interface CoachTextAreaProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function CoachTextArea({
  value,
  onChange,
  onSubmit,
  disabled,
}: CoachTextAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[var(--border)]">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about your training, request a workout..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm
            bg-[var(--surface-raised)] text-[var(--foreground)]
            placeholder-[var(--muted-foreground)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]
            disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-10 h-10 rounded-xl flex items-center justify-center
            bg-[var(--primary-600)] hover:bg-[var(--primary-700)]
            text-white disabled:opacity-40 disabled:pointer-events-none
            transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
