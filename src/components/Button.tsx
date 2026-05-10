"use client";

import React, { type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment for the button. */
  variant?: "primary" | "secondary" | "lime" | "textOnly" | "danger";
  /** Accessible label for icon-only buttons. */
  ariaLabel?: string;
  /** Expands the button to the full width of its parent. */
  block?: boolean;
  /** Clones styles and behavior onto a single child element. */
  asChild?: boolean;
  children: ReactNode;
}

const baseClasses =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold leading-none transition-[background,box-shadow,color,filter,opacity,transform] duration-200 ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:px-6 sm:py-3 sm:text-base active:translate-y-px active:scale-[0.985]";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-[0_10px_26px_rgba(116,87,245,0.24)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_34px_rgba(116,87,245,0.28)]",
  lime:
    "bg-[var(--lime-green)] text-[#232323] shadow-[0_10px_24px_rgba(197,212,74,0.22)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_30px_rgba(197,212,74,0.28)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] hover:shadow-[var(--shadow-sm)]",
  textOnly:
    "bg-transparent text-[var(--primary-600)] shadow-none hover:bg-[var(--primary-50)] dark:text-[var(--primary-700)] dark:hover:bg-[var(--primary-100)]",
  danger:
    "bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] hover:-translate-y-0.5 hover:brightness-95",
};

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
  const classes = [
    baseClasses,
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
