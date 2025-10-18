import Button from "./Button";

interface CancelWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function CancelWorkoutModal({ isOpen, onClose, onConfirm }: CancelWorkoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 h-full w-full flex items-center justify-center z-50">
            <div className="bg-white rounded-sm p-6 flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Are you sure you want to cancel this workout?</h3>
                <p className="mb-6 text-[var(--primary-700)] text-center">All data will be lost.</p>
                <div className="flex gap-4 w-full justify-center">
                    <Button onClick={onConfirm} variant="textOnly" className="text-red-600 hover:text-red-800 ">Cancel Workout</Button>
                    <Button onClick={onClose} variant="primary">Go Back</Button>
                </div>
            </div>
        </div>
    );
}

