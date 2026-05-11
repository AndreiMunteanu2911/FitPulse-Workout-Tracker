"use client";

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthRedirectError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthRedirectError";
  }
}

export type ApiFetchOptions = RequestInit & {
  allowAuthRedirect?: boolean;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text) return null;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getFallbackErrorMessage(response: Response): string {
  if (response.status === 404) return "Endpoint not found. Please refresh and try again.";
  if (response.status === 405) return "This action is not allowed here. Please refresh and try again.";
  if (response.status >= 500) return "Server error. Please try again.";
  return "Request failed. Please try again.";
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === "string" && value.trim()) return value;
  }

  if (typeof body === "string") {
    const trimmed = body.trim();
    if (trimmed && !trimmed.startsWith("<!DOCTYPE") && !trimmed.startsWith("<html")) {
      return trimmed.slice(0, 180);
    }
  }

  return fallback;
}

export async function apiFetch<T>(input: RequestInfo | URL, options: ApiFetchOptions = {}): Promise<T> {
  const { allowAuthRedirect = true, ...init } = options;

  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new AppError("No internet connection. Please check your network and try again.");
    }

    throw new AppError("Request failed. Please try again.");
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && allowAuthRedirect && typeof window !== "undefined") {
      window.location.assign("/login");
      throw new AuthRedirectError();
    }

    throw new AppError(getErrorMessage(body, getFallbackErrorMessage(response)));
  }

  return body as T;
}
