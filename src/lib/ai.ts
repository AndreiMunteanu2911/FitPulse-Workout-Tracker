// ── OpenRouter API Client ────────────────────────────────────────────────────
// Server-only module. Never import this in a "use client" component.
//
// Supports up to 5 models in a fallback chain (1 primary + 4 fallbacks).
// ─────────────────────────────────────────────────────────────────────────────

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function requireEnv(name: string): string | undefined {
  return process.env[name];
}

function resolveEnvList(...keys: string[]): string[] {
  return keys.map((k) => process.env[k]).filter(Boolean) as string[];
}

/** Ordered list of chat models to try (primary first, then fallbacks). */
export const CHAT_MODELS = resolveEnvList(
  "OPENROUTER_CHAT_MODEL",
  "OPENROUTER_FALLBACK_MODEL",
  "OPENROUTER_FALLBACK_MODEL_2",
  "OPENROUTER_FALLBACK_MODEL_3",
  "OPENROUTER_FALLBACK_MODEL_4",
  "OPENROUTER_FALLBACK_MODEL_5",
  "OPENROUTER_FALLBACK_MODEL_6",
  "OPENROUTER_FALLBACK_MODEL_LAST",
);

export const MODELS = {
  chat:      requireEnv("OPENROUTER_CHAT_MODEL")!,
  fallback:  requireEnv("OPENROUTER_FALLBACK_MODEL")!,
  embedding: requireEnv("OPENROUTER_EMBEDDING_MODEL")!,
} as const;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Record<string, unknown>[];
}

// ── Helper: try each model in order until one succeeds ───────────────────────

async function tryWithFallbacks<T>(
  models: string[],
  fn: (model: string) => Promise<T>,
  label: string,
  messages: ChatMessage[],
  options: ChatOptions,
): Promise<T> {
  let lastErr: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (i > 0) {
      console.warn(
        `[OpenRouter] ${label} — trying fallback #${i}: "${model}"`,
      );
    }
    try {
      return await fn(model);
    } catch (err) {
      lastErr = err;
      console.warn(
        `[OpenRouter] ${label} — model "${model}" failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // All models exhausted
  console.error(
    `[OpenRouter] ${label} — all ${models.length} models failed. Last error:`,
    lastErr,
  );
  throw lastErr;
}

// ── Non-streaming chat with automatic fallback ──────────────────────────────
export async function callOpenRouter(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const preferredModels = options.model
    ? [options.model, ...CHAT_MODELS.filter((m) => m !== options.model)]
    : CHAT_MODELS;

  return tryWithFallbacks(
    preferredModels,
    (model) => callOpenRouterInternal(messages, { ...options, model }),
    "chat",
    messages,
    options,
  );
}

async function callOpenRouterInternal(
  messages: ChatMessage[],
  options: ChatOptions & { model: string },
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
      "X-Title": "FitPulse AI Coach",
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      ...(options.tools && { tools: options.tools }),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter API error ${res.status}: ${errText || res.statusText}`,
    );
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenRouter");
  return content;
}

// ── Streaming chat with automatic fallback ──────────────────────────────────
export function streamOpenRouter(
  messages: ChatMessage[],
  options: ChatOptions = {},
): ReadableStream<Uint8Array> {
  const preferredModels = options.model
    ? [options.model, ...CHAT_MODELS.filter((m) => m !== options.model)]
    : CHAT_MODELS;

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < preferredModels.length; i++) {
        const model = preferredModels[i];
        if (i > 0) {
          console.warn(
            `[OpenRouter] stream — trying fallback #${i}: "${model}"`,
          );
        }
        try {
          await streamModel(controller, encoder, messages, { ...options, model });
          return; // Success — we're done
        } catch (err) {
          console.warn(
            `[OpenRouter] stream — model "${model}" failed:`,
            err instanceof Error ? err.message : err,
          );
          // Continue to next fallback
        }
      }

      // All models exhausted
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ error: "All chat models failed. Try again later." })}\n\n`,
        ),
      );
      controller.close();
    },
  });
}

async function streamModel(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  messages: ChatMessage[],
  options: ChatOptions & { model: string },
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
      "X-Title": "FitPulse AI Coach",
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
      ...(options.tools && { tools: options.tools }),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter API error ${res.status}: ${errText || res.statusText}`,
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") {
        controller.close();
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ delta })}\n\n`,
            ),
          );
        }
        // Capture tool call arguments if present
        const toolCall = parsed.choices?.[0]?.delta?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ toolCall: { function: toolCall.function } })}\n\n`,
            ),
          );
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  controller.close();
}

// ── Embedding generation ─────────────────────────────────────────────────────
export async function generateEmbedding(
  text: string,
): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
      "X-Title": "FitPulse AI Coach",
    },
    body: JSON.stringify({
      model: MODELS.embedding,
      input: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter Embedding API error ${res.status}: ${errText || res.statusText}`,
    );
  }

  const json = await res.json();
  const embedding = json.data?.[0]?.embedding;
  if (!embedding) throw new Error("Empty embedding response from OpenRouter");
  // Truncate to 1024 dims (HNSW index limit is 2000; Nemotron outputs 2048)
  return (embedding as number[]).slice(0, 1024);
}
