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
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-4">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Unfinished Sets</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
                You have {summary}. These will be discarded. Finish anyway?
            </p>
            <div className="flex gap-2">
                <Button onClick={onClose} variant="secondary" block>Go Back</Button>
                <Button onClick={onConfirm} variant="danger" block>Discard & Finish</Button>
            </div>
        </ModalWrapper>
    );
}
