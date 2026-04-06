import React from "react";

interface TimeRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  options?: number[];
}

export default function TimeRangeSelector({ value, onChange, options = [7, 14, 30, 90] }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2 mb-6">
      {options.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-semibold transition-colors ${
            value === d
              ? "bg-[var(--primary-500)] text-white"
              : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)]"
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}
