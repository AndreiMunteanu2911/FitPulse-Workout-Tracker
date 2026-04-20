'use client';
import React, { type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | "primary"
        | "secondary"
        | "lime"
        | "textOnly"
        | "danger";
    ariaLabel?: string;
    block?: boolean;
    asChild?: boolean;
    children: ReactNode;
}

export default function Button({
                                   variant = "primary",
                                   block,
                                   ariaLabel,
                                   disabled = false,
                                   onClick,
                                   children,
                                   className = "",
                                   asChild,
                                   ...props
                               }: ButtonProps) {
    const base =
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base font-semibold transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-95";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
        primary:
            "bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white hover:brightness-105",
        lime:
            "bg-[var(--lime-green)] text-[#232323] hover:brightness-105",
        secondary:
            "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-raised)]",
        textOnly:
            "bg-transparent text-[var(--primary-600)] dark:text-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)]",
        danger:
            "bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive-bg)] dark:bg-[var(--color-destructive-bg)] dark:text-[var(--color-destructive)] hover:opacity-90",
    };

    const classes = [
        base,
        variants[variant],
        block ? "w-full" : "",
        className,
    ].filter(Boolean).join(" ");

    if (asChild && React.isValidElement(children)) {
        const child = children as ReactElement<{
            className?: string;
            onClick?: React.MouseEventHandler<HTMLElement>;
            disabled?: boolean;
            "aria-label"?: string;
        }>;
        return React.cloneElement(child, {
            ...props,
            onClick,
            disabled,
            "aria-label": ariaLabel,
            className: [classes, child.props.className].filter(Boolean).join(" "),
        });
    }

    return (
        <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            className={classes}
            {...props}
        >
            {children}
        </button>
    );
}
