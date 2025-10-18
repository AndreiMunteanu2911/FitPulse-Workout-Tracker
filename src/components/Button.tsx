'use client';
import React from 'react';

interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    variant?: 'primary' | 'secondary' | 'textOnly';
}

const Button: React.FC<ButtonProps> = ({
    onClick,
    children,
    type = 'button',
    disabled = false,
    className = '',
    variant = 'primary'
}) => {
    let style: React.CSSProperties = {};
    if (variant === 'primary') {
        style = {
            background: disabled ? 'var(--primary-300)' : 'var(--primary-600)',
            color: 'var(--color-primary-foreground)',
            border: '1px solid transparent',
        };
    } else if (variant === 'secondary') {
        style = {
            background: 'white',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
        };
    } else if (variant === 'textOnly') {
        style = {
            background: 'transparent',
            color: 'var(--primary-400)',
            border: 'none',
            boxShadow: 'none',
        };
    }
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center rounded-sm px-4 py-2 font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            style={style}
            onMouseEnter={variant === 'textOnly' ? (e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-700)';
            }) : undefined}
            onMouseLeave={variant === 'textOnly' ? (e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-400)';
            }) : undefined}
        >
            {children}
        </button>
    );
}

export default Button;
