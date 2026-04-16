"use client";

import { useState } from "react";
import Button from "./Button";
import ModalWrapper from "./ModalWrapper";
import { Share2 } from "lucide-react";

interface FinishWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (shareToFeed: boolean) => void;
}

export default function FinishWorkoutModal({ isOpen, onClose, onConfirm }: FinishWorkoutModalProps) {
    const [shareToFeed, setShareToFeed] = useState(false);

    const handleConfirm = () => {
        onConfirm(shareToFeed);
        setShareToFeed(false);
    };

    const handleClose = () => {
        setShareToFeed(false);
        onClose();
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={handleClose} containerClassName="max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Finish Workout?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Your progress will be saved to your history.</p>
            </div>

            <button
                type="button"
                onClick={() => setShareToFeed((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] mb-5 transition-all border ${
                    shareToFeed
                        ? "bg-[var(--primary-50)] dark:bg-[var(--primary-100)] border-[var(--primary-500)] text-[var(--primary-700)]"
                        : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted-foreground)]"
                }`}
            >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    shareToFeed ? "bg-[var(--primary-500)] border-[var(--primary-500)]" : "border-[var(--muted-foreground)]"
                }`}>
                    {shareToFeed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <Share2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Share workout to social feed</span>
            </button>

            <div className="flex gap-3">
                <Button onClick={handleClose} variant="secondary" block>Go Back</Button>
                <Button onClick={handleConfirm} variant="primary" block>Finish</Button>
            </div>
        </ModalWrapper>
    );
}
