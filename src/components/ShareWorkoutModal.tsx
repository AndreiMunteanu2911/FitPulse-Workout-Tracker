"use client";

import { Share2 } from "lucide-react";
import Button from "./Button";
import ModalWrapper from "./ModalWrapper";

interface ShareWorkoutModalProps {
    isOpen: boolean;
    workoutName: string | undefined;
    onClose: () => void;
    onConfirm: () => void;
    isSharing?: boolean;
}

export default function ShareWorkoutModal({
    isOpen,
    workoutName,
    onClose,
    onConfirm,
    isSharing = false,
}: ShareWorkoutModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                <Share2 className="size-5" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-[var(--foreground)]">Share workout?</h3>
            <p className="mb-5 text-sm leading-6 text-[var(--muted-foreground)]">
                Share &ldquo;{workoutName}&rdquo; with your friends?
            </p>
            <div className="flex gap-2">
                <Button onClick={onClose} variant="secondary" block>Cancel</Button>
                <Button onClick={onConfirm} block disabled={isSharing}>
                    {isSharing ? "Sharing..." : "Share"}
                </Button>
            </div>
        </ModalWrapper>
    );
}
