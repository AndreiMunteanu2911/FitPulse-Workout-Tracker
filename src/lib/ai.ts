// ── OpenRouter API Client ────────────────────────────────────────────────────
// Server-only module. Never import this in a "use client" component.
//
// Models (free tier):
//   Chat:       google/gemma-3-12b-it:free
//   Embeddings: nomic-ai/nomic-embed-text-v1.5  (768-dim vectors)
// ─────────────────────────────────────────────────────────────────────────────

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// All models must be set via environment variables — no hardcoded defaults.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in environment`);
  return value;
}

export const MODELS = {
  chat:      requireEnv("OPENROUTER_CHAT_MODEL"),
  fallback:  requireEnv("OPENROUTER_FALLBACK_MODEL"),
  embedding: requireEnv("OPENROUTER_EMBEDDING_MODEL"),
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

// ── Non-streaming chat with automatic fallback ──────────────────────────────
export async function callOpenRouter(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const primaryModel = options.model ?? MODELS.chat;

  // Try primary model
  try {
    return await callOpenRouterInternal(messages, { ...options, model: primaryModel });
  } catch (primaryErr) {
    // If primary fails, try fallback
    const fallbackModel = MODELS.fallback;
    if (fallbackModel === primaryModel) throw primaryErr; // same model, no point retrying

    console.warn(
      `[OpenRouter] Primary model "${primaryModel}" failed, falling back to "${fallbackModel}"`,
      primaryErr instanceof Error ? primaryErr.message : primaryErr,
    );

    return callOpenRouterInternal(messages, { ...options, model: fallbackModel });
  }
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
  const primaryModel = options.model ?? MODELS.chat;
  const fallbackModel = MODELS.fallback;

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        await streamModel(controller, encoder, messages, { ...options, model: primaryModel });
      } catch (primaryErr) {
        if (fallbackModel === primaryModel) {
          // Same model, just propagate error
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: primaryErr instanceof Error ? primaryErr.message : "Unknown error" })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        // Log fallback
        console.warn(
          `[OpenRouter] Primary model "${primaryModel}" failed, falling back to "${fallbackModel}"`,
          primaryErr instanceof Error ? primaryErr.message : primaryErr,
        );

        try {
          await streamModel(controller, encoder, messages, { ...options, model: fallbackModel });
        } catch (fallbackErr) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: fallbackErr instanceof Error ? fallbackErr.message : "Unknown error" })}\n\n`,
            ),
          );
          controller.close();
        }
      }
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
