import Button from "./Button";
import ModalWrapper from "./ModalWrapper";

interface DiscardSetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    incompleteSetCount: number;
    emptyExerciseCount: number;
}

export default function DiscardSetsModal({
    isOpen,
    onClose,
    onConfirm,
    incompleteSetCount,
    emptyExerciseCount,
}: DiscardSetsModalProps) {
    const parts: string[] = [];
    if (incompleteSetCount > 0) {
        parts.push(`${incompleteSetCount} unfinished set${incompleteSetCount !== 1 ? "s" : ""}`);
    }
    if (emptyExerciseCount > 0) {
        parts.push(`${emptyExerciseCount} exercise${emptyExerciseCount !== 1 ? "s" : ""} with no valid sets`);
    }
    const summary = parts.join(" and ");

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-[var(--color-warning-bg)] flex items-center justify-center">
                    <svg className="w-7 h-7 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Unfinished Sets</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                    You have {summary}. These will be discarded. Do you want to finish anyway?
                </p>
            </div>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary" block>Go Back</Button>
                <Button onClick={onConfirm} variant="danger" block>Discard & Finish</Button>
            </div>
        </ModalWrapper>
    );
}
