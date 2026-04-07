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
    <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-[var(--border)]">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about your training, request a workout..."
          disabled={disabled}
          className="flex-1 px-5 py-3.5 rounded-full text-[15px]
            bg-[var(--surface-raised)] text-[var(--foreground)]
            placeholder-[var(--muted-foreground)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]
            disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
            bg-[var(--primary-600)] hover:bg-[var(--primary-700)]
            text-white disabled:opacity-40 disabled:pointer-events-none
            transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
