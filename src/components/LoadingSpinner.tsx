interface LoadingSpinnerProps {
    size?: number;
    className?: string;
    variant?: "default" | "image";
}

export default function LoadingSpinner({ size = 8, className = "", variant = "default" }: LoadingSpinnerProps) {
    const dimension = `${size * 0.25}rem`;

    if (variant === "image") {
        return (
            <div
                className="animate-spin rounded-full border-2 border-b-white border-l-transparent border-r-white border-t-transparent"
                style={{ width: dimension, height: dimension, borderTopColor: "var(--color-primary)" }}
            />
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className="animate-spin rounded-full border-4 border-b-white border-l-white border-r-white border-t-white"
                style={{ width: dimension, height: dimension, borderTopColor: "var(--color-primary)" }}
            ></div>
            <span className="ml-3 md:ml-6 text-sm md:text-base text-[color:var(--primary-500)] font-semibold">Loading...</span>
        </div>
    );
}
