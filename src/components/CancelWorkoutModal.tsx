import Button from "./Button";
import ModalWrapper from "./ModalWrapper";

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
                    <svg className="w-7 h-7 text-[var(--color-destructive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
