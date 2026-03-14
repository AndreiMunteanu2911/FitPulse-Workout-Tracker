import Button from "./Button";
import ModalWrapper from "./ModalWrapper";
import { X } from "lucide-react";

interface CancelWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function CancelWorkoutModal({ isOpen, onClose, onConfirm }: CancelWorkoutModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-[var(--color-destructive-bg)] flex items-center justify-center">
                    <X className="w-7 h-7 text-[var(--color-destructive)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Cancel Workout?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">All data will be permanently lost.</p>
            </div>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="primary" block>Keep Going</Button>
                <Button onClick={onConfirm} variant="danger" block>Cancel Workout</Button>
            </div>
        </ModalWrapper>
    );
}
