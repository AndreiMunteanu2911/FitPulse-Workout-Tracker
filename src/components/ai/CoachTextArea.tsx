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
    <form onSubmit={handleSubmit} className="w-full min-w-0 shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about your training, request a workout..."
          disabled={disabled}
          className="w-0 min-w-0 flex-1 rounded-full px-4 py-3.5 text-[15px] sm:px-5
            bg-[var(--surface-raised)] text-[var(--foreground)]
            placeholder-[var(--muted-foreground)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]
            disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12
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
