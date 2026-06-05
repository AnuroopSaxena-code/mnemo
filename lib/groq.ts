import Groq from "groq-sdk";

let client: Groq | null = null;

export function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

/**
 * Fast, accurate structured output — used for decision extraction.
 * Small model is fine here; the schema is strict and temperature is 0.
 */
export const GROQ_MODEL_EXTRACT = "llama-3.1-8b-instant";

/**
 * Best reasoning — used for pre-mortem synthesis where depth matters.
 * Qwen-2.5-32B is fast and supports JSON mode / tool calling.
 */
export const GROQ_MODEL_SYNTHESIS = "qwen-2.5-32b";

/**
 * Balanced quality for memory-backed Q&A answers.
 */
export const GROQ_MODEL_CHAT = "qwen-2.5-32b";

/**
 * Legacy alias — kept so any future callers have a safe default.
 */
export const GROQ_MODEL = GROQ_MODEL_SYNTHESIS;
