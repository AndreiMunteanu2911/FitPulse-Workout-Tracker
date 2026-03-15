import React from "react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import { X, Trash2 } from "lucide-react";

interface DeleteTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    templateName: string;
}

const DeleteTemplateModal: React.FC<DeleteTemplateModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    templateName,
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
            <button
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                onClick={onClose}
                aria-label="Close"
                type="button"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-destructive-bg)] flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-[var(--color-destructive)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Delete Template</h2>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[var(--foreground)]">{templateName}</span>?
                This action cannot be undone.
            </p>

            <div className="flex gap-3">
                <Button type="button" variant="secondary" block onClick={onClose}>
                    Cancel
                </Button>
                <Button type="button" variant="danger" block onClick={handleConfirm}>
                    Delete
                </Button>
            </div>
        </ModalWrapper>
    );
};

export default DeleteTemplateModal;
