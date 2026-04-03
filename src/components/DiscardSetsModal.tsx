import Button from "./Button";
import ModalWrapper from "./ModalWrapper";

interface DiscardSetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onConfirmAll: () => void;
    incompleteSetCount: number;
    emptyExerciseCount: number;
}

export default function DiscardSetsModal({
    isOpen,
    onClose,
    onConfirm,
    onConfirmAll,
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
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-4">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Unfinished Sets</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
                You have {summary}.
            </p>
            <div className="space-y-2">
                <Button onClick={onConfirmAll} variant="primary" block>Confirm All &amp; Finish</Button>
                <div className="flex gap-2">
                    <Button onClick={onClose} variant="secondary" block>Go Back</Button>
                    <Button onClick={onConfirm} variant="danger" block>Discard &amp; Finish</Button>
                </div>
            </div>
        </ModalWrapper>
    );
}
