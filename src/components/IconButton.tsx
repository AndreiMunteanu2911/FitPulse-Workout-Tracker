'use client';
import React from 'react';
import Image from 'next/image';

interface IconButtonProps {
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    variant?: 'primary' | 'secondary';
    image: string;
    alt?: string;
    size?: number;
}

const IconButton: React.FC<IconButtonProps> = ({
                                                   onClick,
                                                   type = 'button',
                                                   disabled = false,
                                                   className = '',
                                                   variant = 'primary',
                                                   image,
                                                   alt = 'icon',
                                                   size = 40
                                               }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full p-0 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        style={{
            width: size,
            height: size,
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
        aria-label={alt}
    >
        <Image
            src={image}
            alt={alt}
            width={size * 0.6}
            height={size * 0.6}
            className={`w-[${size * 0.6}px] h-[${size * 0.6}px] max-w-[24px] max-h-[24px]`}
            style={{ width: size * 0.6, height: size * 0.6 }}
            aria-hidden="true"
        />
    </button>
);

export default IconButton;