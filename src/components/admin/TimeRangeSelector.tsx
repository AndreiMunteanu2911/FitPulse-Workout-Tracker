import React from "react";

interface TimeRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  options?: number[];
}

export default function TimeRangeSelector({ value, onChange, options = [7, 14, 30, 90] }: TimeRangeSelectorProps) {
  return (
    <div className="segmented-control w-full sm:w-fit">
      {options.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`segmented-control-item sm:min-w-14 ${
            value === d
              ? "segmented-control-item-active"
              : ""
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}
