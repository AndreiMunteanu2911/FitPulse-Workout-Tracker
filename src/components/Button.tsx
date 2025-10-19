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
        "inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:cursor-not-allowed disabled:opacity-60";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
        primary: "bg-[var(--primary-800)] text-white border border-transparent hover:bg-[var(--primary-900)] focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
        secondary: "bg-white text-[var(--primary-700)] border border-[var(--primary-200)] hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
        textOnly:
            "bg-transparent border-none shadow-none text-[var(--primary-400)] text-[var(--primary-800)] active:scale-95",
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