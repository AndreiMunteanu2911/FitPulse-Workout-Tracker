'use client';
import React, { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | "primary"
        | "secondary"
        | "textOnly";
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
        "inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 active:scale-95";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
        primary: "bg-[var(--primary-800)] dark:bg-[var(--primary-600)] text-white border border-transparent hover:bg-[var(--primary-900)] dark:hover:bg-[var(--primary-500)]",
        secondary: "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface)]/80",
        textOnly:
            "bg-transparent border-none shadow-none text-[var(--primary-700)] dark:text-[var(--primary-300)]",
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