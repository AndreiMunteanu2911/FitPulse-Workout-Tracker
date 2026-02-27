import React from "react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";

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
        <ModalWrapper isOpen={show} onClose={onClose} containerClassName="max-w-xs sm:max-w-sm p-6">
            <button
                className="absolute top-2 right-2 text-xl font-bold text-[var(--foreground)] hover:opacity-70"
                onClick={onClose}
                aria-label="Close"
                type="button"
            >
                ×
            </button>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    await onSubmit(initialDate, initialWeight);
                }}
                className="space-y-4"
            >
                <div>
                    <label className="block mb-1 text-sm text-[var(--foreground)]">Date</label>
                    <input
                        type="date"
                        value={initialDate}
                        onChange={(e) => setDate(e.target.value)}
                        className="border border-[var(--border)] rounded px-2 py-1 w-full bg-[var(--surface)] text-[var(--foreground)]"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm text-[var(--foreground)]">Weight (kg)</label>
                    <input
                        type="number"
                        value={initialWeight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="border border-[var(--border)] rounded px-2 py-1 w-full bg-[var(--surface)] text-[var(--foreground)]"
                    />
                </div>
                <Button type="submit" variant="primary" className="w-full">Add Entry</Button>
            </form>
        </ModalWrapper>
    );
};

export default AddWeightModal;
