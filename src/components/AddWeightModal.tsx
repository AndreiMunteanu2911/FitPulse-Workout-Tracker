import React from "react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import { X } from "lucide-react";

interface AddWeightModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (date: string, weight: string) => Promise<void>;
    initialDate: string;
    initialWeight: string;
    setDate: (date: string) => void;
    setWeight: (weight: string) => void;
}

const AddWeightModal: React.FC<AddWeightModalProps> = ({
    show,
    onClose,
    onSubmit,
    initialDate,
    initialWeight,
    setDate,
    setWeight,
}) => {
    return (
        <ModalWrapper isOpen={show} onClose={onClose} containerClassName="max-w-sm p-6">
            <button
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                onClick={onClose}
                aria-label="Close"
                type="button"
            >
                <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Log Weight</h2>

            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    await onSubmit(initialDate, initialWeight);
                }}
                className="space-y-4"
            >
                <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Date</label>
                    <input
                        type="date"
                        value={initialDate}
                        onChange={(e) => setDate(e.target.value)}
                        className="input"
                    />
                </div>
                <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Weight (kg)</label>
                    <input
                        type="number"
                        value={initialWeight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="input"
                        placeholder="70.5"
                        step="0.1"
                        min="0"
                    />
                </div>
                <Button type="submit" variant="primary" block>Save Entry</Button>
            </form>
        </ModalWrapper>
    );
};

export default AddWeightModal;
