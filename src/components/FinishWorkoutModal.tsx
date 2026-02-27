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
            <div className="text-xl font-semibold mb-4 text-[var(--foreground)] text-center">Are you sure you want to finish this workout?</div>
            <div className="mb-6 text-[var(--primary-700)] text-center">Your progress will be saved.</div>
            <div className="flex gap-4 w-full justify-around">
                <Button onClick={onConfirm} variant="primary">Finish Workout</Button>
                <Button onClick={onClose} variant="textOnly">Go Back</Button>
            </div>
        </ModalWrapper>
    );
}
