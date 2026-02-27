import React from "react";

interface WeightLogCardProps {
    date: string; // ISO string
    weight: number;
}

const WeightLogCard: React.FC<WeightLogCardProps> = ({ date, weight }) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    return (
        <div className="flex justify-between items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--surface)] w-full border-b border-[var(--border)] last:border-b-0">
            <span className="text-[var(--foreground)] font-semibold">{formattedDate}</span>
            <span className="text-[var(--primary-700)] font-semibold">{weight} kg</span>
        </div>
    );
};

export default WeightLogCard;