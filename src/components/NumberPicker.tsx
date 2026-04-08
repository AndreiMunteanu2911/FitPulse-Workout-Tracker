"use client";

import { useRef, useEffect, useCallback } from "react";

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  height?: number;
}

const ITEM_HEIGHT = 56;

export default function NumberPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  height = 200,
}: NumberPickerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWheelRef = useRef(false);

  const values: number[] = [];
  for (let v = min; v <= max; v += step) {
    values.push(v);
  }

  // Scroll to current value on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = values.indexOf(value);
    if (idx >= 0) {
      el.scrollTop = idx * ITEM_HEIGHT;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapToNearest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(values.length - 1, idx));
    const newValue = values[clampedIdx];
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [value, values, onChange]);

  const handleScroll = useCallback(() => {
    if (isWheelRef.current) return; // Let wheel handler manage it
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(snapToNearest, 100);
  }, [snapToNearest]);

  // Handle mouse wheel: prevent default browser scroll, do smooth snap
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isWheelRef.current = true;

    const el = scrollRef.current;
    if (!el) return;

    const delta = e.deltaY > 0 ? ITEM_HEIGHT : -ITEM_HEIGHT;
    const currentScroll = el.scrollTop;
    const targetScroll = currentScroll + delta;
    const idx = Math.round(targetScroll / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(values.length - 1, idx));
    const newValue = values[clampedIdx];

    el.scrollTo({ top: clampedIdx * ITEM_HEIGHT, behavior: "smooth" });

    if (newValue !== value) {
      onChange(newValue);
    }

    setTimeout(() => { isWheelRef.current = false; }, 300);
  }, [value, values, onChange]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{ height, overscrollBehavior: "none" }}
    >
      {/* Selection indicator */}
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none"
        style={{
          top: (height - ITEM_HEIGHT) / 2,
          height: ITEM_HEIGHT,
          borderTop: "2px solid rgba(198, 255, 0, 0.3)",
          borderBottom: "2px solid rgba(198, 255, 0, 0.3)",
        }}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="overflow-y-auto overflow-x-hidden snap-y snap-mandatory scrollbar-hide"
        style={{
          height,
          scrollSnapType: "y mandatory",
          overscrollBehavior: "none",
        }}
      >
        <div style={{ height: (height - ITEM_HEIGHT) / 2 }} />

        {values.map((v) => {
          const isActive = v === value;
          return (
            <div
              key={v}
              className={`flex items-center justify-center snap-center select-none transition-all ${
                isActive ? "text-white text-4xl font-extrabold" : "text-white/30 text-xl font-medium"
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {v}
            </div>
          );
        })}

        <div style={{ height: (height - ITEM_HEIGHT) / 2 }} />
      </div>
    </div>
  );
}
