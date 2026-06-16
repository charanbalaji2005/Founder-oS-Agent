import * as SecureStore from "expo-secure-store";
import { BACKEND_URL, STORAGE_KEYS } from "@/constants";
import type { GroqMessage, GroqModel } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroqCallOptions {
  model: GroqModel;
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string, full: string) => void;
}

interface GroqStreamChunk {
  choices: { delta: { content?: string } }[];
}

// ─── API Key helpers ──────────────────────────────────────────────────────────

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.GROQ_API_KEY);
  } catch {
    return null;
  }
}

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.GROQ_API_KEY, key);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.GROQ_API_KEY);
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        apiKey: key,
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Core Groq Call ───────────────────────────────────────────────────────────

export async function groqCall({
  model,
  messages,
  temperature = 0.7,
  maxTokens = 1500,
  onChunk,
}: GroqCallOptions): Promise<string> {
  const isStream = !!onChunk;
  const apiKey = await getApiKey();

  const response = await fetch(`${BACKEND_URL}/api/agents/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: isStream,
      apiKey: apiKey || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData as { error?: string }).error ||
      `Server error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }

  if (isStream && onChunk) {
    return handleStream(response, onChunk);
  }

  const data = await response.json();
  return (data as { content: string }).content;
}

// ─── Stream Handler ───────────────────────────────────────────────────────────

async function handleStream(
  response: Response,
  onChunk: (chunk: string, full: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder
      .decode(value)
      .split("\n")
      .filter((line) => line.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed: GroqStreamChunk = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          onChunk(content, fullText);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export async function groqComplete(
  userPrompt: string,
  systemPrompt: string,
  model: GroqModel,
  onChunk?: (chunk: string, full: string) => void
): Promise<string> {
  return groqCall({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    onChunk,
  });
}
