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
            <h3 className="text-xl font-semibold mb-4 text-[var(--foreground)] text-center">Are you sure you want to cancel this workout?</h3>
            <div className="mb-6 text-[var(--primary-700)] text-center">All data will be lost.</div>
            <div className="flex gap-4 w-full justify-around">
                <Button onClick={onConfirm} variant="textOnly" className="text-red-600 hover:text-red-800">Cancel Workout</Button>
                <Button onClick={onClose} variant="primary">Go Back</Button>
            </div>
        </ModalWrapper>
    );
}
