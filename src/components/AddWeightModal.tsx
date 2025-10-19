import React, { useState } from "react";
import Button from "@/components/Button";

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
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
            <div className="bg-white rounded-lg p-6 w-full max-w-xs sm:max-w-sm relative">
                <button
                    className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-700"
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
                        <label className="block mb-1 text-sm">Date</label>
                        <input
                            type="date"
                            value={initialDate}
                            onChange={(e) => setDate(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Weight (kg)</label>
                        <input
                            type="number"
                            value={initialWeight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <Button type="submit" variant="primary" className="w-full">Add Entry</Button>
                </form>
            </div>
        </div>
    );
};

export default AddWeightModal;