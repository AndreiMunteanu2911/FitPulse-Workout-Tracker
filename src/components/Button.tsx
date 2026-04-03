'use client';
import React, { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | "primary"
        | "secondary"
        | "textOnly"
        | "danger";
    ariaLabel?: string;
    block?: boolean;
}

export default function Button({
                                   variant = "primary",
                                   block,
                                   ariaLabel,
                                   disabled = false,
                                   onClick,
                                   children,
                                   className = "",
                                   ...props
                               }: ButtonProps) {
    const base =
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base font-semibold transition-all duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-95";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
        primary:
            "bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-700)] dark:from-[var(--primary-500)] dark:to-[var(--primary-600)] text-white shadow-[0_2px_10px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_18px_rgba(99,102,241,0.45)] hover:brightness-105",
        secondary:
            "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-raised)] hover:shadow-[var(--shadow-sm)]",
        textOnly:
            "bg-transparent text-[var(--primary-600)] dark:text-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)]",
        danger:
            "bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive-bg)] dark:bg-[var(--color-destructive-bg)] dark:text-[var(--color-destructive)] hover:opacity-90",
    };

    return (
        <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            className={[
                base,
                variants[variant],
                block ? "w-full" : "",
                className,
            ].filter(Boolean).join(" ")}
            {...props}
        >
            {children}
        </button>
    );
}
