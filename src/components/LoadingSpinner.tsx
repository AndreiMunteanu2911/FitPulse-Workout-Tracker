interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

export default function LoadingSpinner({ size = 8, className = "" }: LoadingSpinnerProps) {
    const h = `h-${size}`;
    const w = `w-${size}`;

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