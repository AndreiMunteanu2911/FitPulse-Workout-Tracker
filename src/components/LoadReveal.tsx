"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface LoadRevealProps {
  children: ReactNode;
  className?: string;
}

export default function LoadReveal({ children, className = "" }: LoadRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.16, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
