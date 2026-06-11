import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--primary-500)]" />
      <input
        type="text"
        placeholder={placeholder}
        className="input !pl-11 shadow-[var(--shadow-xs)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
