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
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === "string" && value.trim()) return value;
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

    throw new AppError(getErrorMessage(body, "Request failed. Please try again."));
  }

  return body as T;
}
