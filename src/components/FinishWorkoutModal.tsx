import Button from "./Button";

interface FinishWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function FinishWorkoutModal({ isOpen, onClose, onConfirm }: FinishWorkoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 h-full w-full flex items-center justify-center z-50">
            <div className="bg-white rounded-sm p-6 flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Are you sure you want to finish this workout?</h3>
                <p className="mb-6 text-[var(--primary-700)] text-center">Your progress will be saved.</p>
                <div className="flex gap-4 w-full justify-center">
                    <Button onClick={onConfirm} variant="primary">Finish Workout</Button>
                    <Button onClick={onClose} variant="textOnly">Go Back</Button>
                </div>
            </div>
        </div>
    );
}

