import crypto from "crypto";
import type { DecisionRecord } from "@/lib/types";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "into",
  "should",
  "would",
  "could",
  "about",
  "because",
  "have",
  "been",
  "were",
  "will",
  "lets",
  "let",
  "back",
  "move",
  "using",
  "instead"
]);

export function stableHash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9#+.-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function keywordScore(query: string, decision: DecisionRecord) {
  const queryTokens = new Set(tokenize(query));
  const haystack = tokenize(
    [
      decision.title,
      decision.decision,
      decision.rationale,
      decision.scope,
      decision.tags.join(" "),
      decision.alternatives.map((alt) => `${alt.name} ${alt.rejectedBecause}`).join(" ")
    ].join(" ")
  );
  if (queryTokens.size === 0) return 0;
  let score = 0;
  for (const token of haystack) {
    if (queryTokens.has(token)) score += 1;
  }
  for (const tag of decision.tags) {
    if (query.toLowerCase().includes(tag.toLowerCase())) score += 3;
  }
  // Normalize by query size, not document size.
  // Previously divided by sqrt(haystack.length) which penalised longer, richer records.
  // Dividing by sqrt(queryTokens.size) keeps scores comparable regardless of document length,
  // so detailed ADRs are not ranked lower than sparse records.
  return score / Math.sqrt(queryTokens.size + 1);
}
