import { HindsightClient } from "@vectorize-io/hindsight-client";

let client: HindsightClient | null = null;

export const HINDSIGHT_BANK_ID = process.env.HINDSIGHT_BANK_ID || "mnemo-engineering-decisions";

export function hasHindsightKey() {
  return Boolean(process.env.HINDSIGHT_API_KEY);
}

export function getHindsightClient() {
  if (!process.env.HINDSIGHT_API_KEY) {
    throw new Error("HINDSIGHT_API_KEY is not configured.");
  }
  if (!client) {
    client = new HindsightClient({
      baseUrl: process.env.HINDSIGHT_BASE_URL || "https://api.hindsight.vectorize.io",
      apiKey: process.env.HINDSIGHT_API_KEY
    });
  }
  return client;
}
