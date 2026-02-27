interface LoadingSpinnerProps {
    size?: number;
    className?: string;
    variant?: "default" | "image";
}

export default function LoadingSpinner({ size = 8, className = "", variant = "default" }: LoadingSpinnerProps) {
    const h = `h-${size}`;
    const w = `w-${size}`;

    if (variant === "image") {
        return (
            <div
                className={`animate-spin rounded-full ${h} ${w} border-2 border-t-transparent border-l-transparent border-r-white border-b-white`}
                style={{ borderTopColor: "var(--color-primary)" }}
            />
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`animate-spin rounded-full ${h} ${w} border-4 border-t-white border-b-white border-l-white border-r-white`}
                style={{ borderTopColor: "var(--color-primary)" }}
            ></div>
            <span className="ml-3 md:ml-6 text-sm md:text-base text-[color:var(--primary-500)] font-semibold">Loading...</span>
        </div>
    );
}