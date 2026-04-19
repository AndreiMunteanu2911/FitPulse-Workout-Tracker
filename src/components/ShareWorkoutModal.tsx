"use client";

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
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-5">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Share Workout?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Share &ldquo;{workoutName}&rdquo; with your friends?
            </p>
            <div className="flex gap-2">
                <Button onClick={onClose} variant="secondary" block>Cancel</Button>
                <Button onClick={onConfirm} block disabled={isSharing}>
                    {isSharing ? "Sharing…" : "Confirm"}
                </Button>
            </div>
        </ModalWrapper>
    );
}
