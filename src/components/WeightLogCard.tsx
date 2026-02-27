import React from "react";

interface WeightLogCardProps {
    date: string; // ISO string
    weight: number;
    id?: string;
    onDelete?: (id: string) => void;
}

const WeightLogCard: React.FC<WeightLogCardProps> = ({ date, weight, id, onDelete }) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    return (
        <div className="flex justify-between items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--surface)] w-full border-b border-[var(--border)] last:border-b-0">
            <div className="flex items-center gap-3">
                <span className="text-[var(--foreground)] font-semibold">{formattedDate}</span>
                <span className="text-[var(--primary-700)] font-semibold">{weight} kg</span>
            </div>
            {onDelete && id && (
                <button
                    onClick={() => onDelete(id)}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2"
                    aria-label="Delete weight entry"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default WeightLogCard;