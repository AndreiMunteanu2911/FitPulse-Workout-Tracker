'use client';
import React from 'react';

interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
                                           onClick,
                                           children,
                                           type = 'button',
                                           disabled = false,
                                           className = '',
                                           variant = 'primary'
                                       }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-sm px-4 py-2 font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        style={{
            background: variant === 'primary' ? (disabled ? 'var(--primary-300)' : 'var(--primary-600)') : 'white',
            color: variant === 'primary' ? 'var(--color-primary-foreground)' : 'var(--primary-700)',
            border: variant === 'primary' ? '1px solid transparent' : '1px solid var(--primary-200)'
        }}
        onMouseEnter={(e) => {
            if (disabled) return;
            (e.currentTarget as HTMLButtonElement).style.background = variant === 'primary' ? 'var(--primary-700)' : 'var(--primary-50)';
        }}
        onMouseLeave={(e) => {
            if (disabled) return;
            (e.currentTarget as HTMLButtonElement).style.background = variant === 'primary' ? 'var(--primary-600)' : 'white';
        }}
    >
        {children}
    </button>
);

export default Button;