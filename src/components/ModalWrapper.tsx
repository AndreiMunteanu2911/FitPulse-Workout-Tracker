"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    position?: "center" | "bottom";
    zIndex?: number;
}

export default function ModalWrapper({
    isOpen,
    onClose,
    children,
    className = "",
    containerClassName = "",
    position = "center",
    zIndex = 50,
}: ModalWrapperProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const variants = {
        center: {
            initial: { y: "100vh", opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: "100vh", opacity: 0 },
        },
        bottom: {
            initial: { y: "100vh" },
            animate: { y: 0 },
            exit: { y: "100vh" },
        },
    };

    // Determine alignment classes based on position
    const alignmentClasses = position === "bottom"
        ? "items-end pb-0"
        : "items-center p-4";

    // Determine border radius classes based on position
    const borderRadiusClasses = position === "bottom"
        ? "rounded-t-2xl"
        : "rounded-2xl";

    const damping = position === "center" ? 25 : 30;
    const stiffness = position === "center" ? 220 : 250;

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-overlay"
                    className={`fixed inset-0 flex justify-center bg-black/60 backdrop-blur-sm ${alignmentClasses} ${className}`}
                    style={{ zIndex }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        key="modal-container"
                        className={`bg-[var(--surface)] relative flex w-full flex-col ${borderRadiusClasses} ${containerClassName}`}
                        style={{ willChange: "transform" }}
                        onClick={(e) => e.stopPropagation()}
                        initial={variants[position].initial}
                        animate={variants[position].animate}
                        exit={variants[position].exit}
                        transition={{ type: "spring", damping: damping, stiffness: stiffness }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
