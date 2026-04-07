'use client';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Lime-green toggle switch.
 *
 * Sizes:
 *   sm — 40×22 (used in menu rows)
 *   md — 48×26 (default)
 *   lg — 56×30
 */
export default function ToggleSwitch({ checked, onChange, size = 'md' }: ToggleSwitchProps) {
  const dims = {
    sm: { track: 'w-10 h-[22px]', thumb: 'w-4 h-4', translate: checked ? 'translate-x-[18px]' : 'translate-x-0.5' },
    md: { track: 'w-12 h-[26px]', thumb: 'w-5 h-5', translate: checked ? 'translate-x-[22px]' : 'translate-x-0.5' },
    lg: { track: 'w-14 h-[30px]', thumb: 'w-6 h-6', translate: checked ? 'translate-x-[26px]' : 'translate-x-0.5' },
  }[size];

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:ring-offset-2 ${
        checked ? 'bg-[var(--lime-green)]' : 'bg-[#C4C4C4] dark:bg-[#4B4B4B]'
      } ${dims.track}`}
    >
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white transition-transform duration-200 ${dims.thumb} ${dims.translate}`}
      />
    </button>
  );
}
