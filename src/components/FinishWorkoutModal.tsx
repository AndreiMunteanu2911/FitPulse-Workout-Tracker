import Button from "./Button";
import ModalWrapper from "./ModalWrapper";

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
                    <svg className="w-7 h-7 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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
