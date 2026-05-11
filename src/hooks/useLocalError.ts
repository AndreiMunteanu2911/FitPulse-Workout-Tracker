"use client";

import { useCallback, useState } from "react";
import { AppError, AuthRedirectError } from "@/services/api/apiFetch";

export { AppError, AuthRedirectError };

export interface UseLocalErrorResult {
  error: string | null;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

function toMessage(error: unknown): string | null {
  if (error instanceof AuthRedirectError) return null;
  if (error instanceof DOMException && error.name === "AbortError") return null;
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;

  return "Something went wrong. Please try again.";
}

export function useLocalError(): UseLocalErrorResult {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(
    function clearErrorCallback(): void {
      setError(null);
    },
    [],
  );

  const handleError = useCallback(
    function handleErrorCallback(value: unknown): void {
      const message = toMessage(value);
      if (!message) return;
      setError(message);
    },
    [],
  );

  return { error, clearError, handleError };
}
