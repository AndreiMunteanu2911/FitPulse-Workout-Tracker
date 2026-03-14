import React from "react";
import { Trash2 } from "lucide-react";

interface WeightLogCardProps {
    date: string;
    weight: number;
    id?: string;
    onDelete?: (id: string) => void;
}

const WeightLogCard: React.FC<WeightLogCardProps> = ({ date, weight, id, onDelete }) => {
    const d = new Date(date);
    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-raised)] transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--primary-400)] flex-shrink-0" />
                <span className="text-sm font-medium text-[var(--foreground)]">{formatted}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--primary-600)] dark:text-[var(--primary-500)]">{weight} kg</span>
                {onDelete && id && (
                    <button
                        onClick={() => onDelete(id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)] transition-colors"
                        aria-label="Delete weight entry"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default WeightLogCard;
