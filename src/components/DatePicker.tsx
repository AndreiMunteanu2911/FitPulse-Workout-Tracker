"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export default function DatePicker({ value, onChange, placeholder = "Select date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = parseDate(value);
    return d ? d.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseDate(value);
    return d ? d.getMonth() : new Date().getMonth();
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => parseDate(value), [value]);

  // Sync view to selected date when opening the picker
  useEffect(() => {
    if (isOpen && selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [isOpen]); // only run when opening, not on every selectedDate change

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const goToPrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // Build calendar grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleSelectDay = (day: number) => {
    const month = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    onChange(`${viewYear}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary-500)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/20 transition text-left"
      >
        <CalendarIcon className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        <span className={displayValue ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
          {displayValue || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToPrevMonth(); }}
              className="w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" />
            </button>
            <span className="text-sm font-semibold text-[var(--foreground)] select-none">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToNextMonth(); }}
              className="w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[var(--foreground)]" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[var(--muted-foreground)] py-1 select-none">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-3 pb-3">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center py-0.5">
                {day !== null && (
                  <button
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors select-none ${
                      isSelected(day)
                        ? "bg-[var(--primary-500)] text-white"
                        : isToday(day)
                          ? "bg-[var(--lime-green)]/20 text-[var(--lime-green)] font-bold"
                          : "text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
