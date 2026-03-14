import Button from "./Button";
import ModalWrapper from "./ModalWrapper";
import { Check } from "lucide-react";

interface FinishWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function FinishWorkoutModal({ isOpen, onClose, onConfirm }: FinishWorkoutModalProps) {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center">
                    <Check className="w-7 h-7 text-[var(--color-success)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Finish Workout?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Your progress will be saved to your history.</p>
            </div>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary" block>Go Back</Button>
                <Button onClick={onConfirm} variant="primary" block>Finish</Button>
            </div>
        </ModalWrapper>
    );
}
