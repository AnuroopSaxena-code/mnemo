import { z } from "zod";
import type { DecisionAlternative, DecisionRecord, ExtractedDecision, SourceType } from "@/lib/types";
import { getGroqClient, GROQ_MODEL_EXTRACT, hasGroqKey } from "@/lib/groq";
import { readCache, writeCache } from "@/lib/cache";
import { stableHash, tokenize } from "@/lib/text";

const extractionSchema = z.object({
  decision: z.string().min(3),
  rationale: z.string().min(1),
  alternatives: z.array(z.object({ name: z.string(), rejectedBecause: z.string() })).default([]),
  caveats: z.array(z.string()).default([]),
  scope: z.string().default("unknown"),
  people: z.array(z.string()).default([]),
  date: z.string().optional(),
  tags: z.array(z.string()).default([]),
  lifecycleHint: z.enum(["proposed", "decided", "reinforced", "revisited", "reversed", "stale"]).default("proposed")
});

export const EXTRACTION_SYSTEM_PROMPT = `You extract engineering decisions from team notes for institutional memory.
Return a single JSON object only. No markdown, no code fences, no commentary.

Fields to extract — follow each instruction precisely:

decision (string):
  A complete sentence stating exactly what was decided or proposed.
  Good: "We decided to move billing events from Kafka to a PostgreSQL outbox pattern."
  Bad: "Kafka billing" or "move to postgres"

rationale (string):
  The concrete business or technical reason in 1-2 full sentences.
  If genuinely unstated, return "Not stated in source." — never hallucinate.

alternatives (array):
  Rejected options. Each must have:
    name: what the alternative was (e.g. "RabbitMQ", "keeping Kafka")
    rejectedBecause: why it was not chosen (full sentence)
  If no alternatives are mentioned, return [].

caveats (array of strings):
  Expiry conditions, revisit triggers, or known risks. Each is a full sentence.
  Example: "Revisit if daily event volume exceeds 500k." Return [] if none.

scope (string):
  The affected service or system, lowercase. E.g. "billing-events", "auth", "ci-pipeline".

people (array of strings):
  Named participants or @handles found in the text. E.g. ["@alice", "Bob Chen"].
  Return [] if nobody is named.

date (string, optional):
  ISO-8601 date (YYYY-MM-DD) if mentioned. Omit the field if not found.

tags (3-7 lowercase strings):
  Technical keywords. Prefer precise terms: "kafka", "outbox", "billing", "postgres".
  Avoid generic words like "change", "update", "decision".

lifecycleHint (one of):
  "proposed"    — the decision is being discussed or drafted, not yet confirmed
  "decided"     — the text confirms a final choice was made
  "reinforced"  — the text references a prior decision approvingly or confirms it held up
  "revisited"   — the team is re-opening an old decision for review
  "reversed"    — the prior decision is being undone, rolled back, or explicitly cancelled
  "stale"       — the decision is being flagged as outdated or expired

Source type context:
  github → likely a PR description or review comment; decisions may be implicit
  slack → informal language; look harder for intent signals in casual phrasing
  discord → community/startup chat thread; find decisions in quick back-and-forth
  whatsapp → fast-moving group message updates; extract intent from highly casual phrases
  adr → formal; will typically have explicit Alternatives and Context sections
  manual → direct note from the team; treat as authoritative
  seed → already-structured demo data; extract faithfully`;

export async function extractDecision(rawText: string, sourceType: SourceType): Promise<ExtractedDecision> {
  const cacheKey = `extract-${stableHash(`${sourceType}:${rawText}`)}`;
  const cached = await readCache<ExtractedDecision>(cacheKey);
  if (cached) return cached;

  if (hasGroqKey()) {
    const response = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL_EXTRACT,
      temperature: 0,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Source type: ${sourceType}\n\nRaw text:\n${rawText.slice(0, 6000)}`
        }
      ]
    });
    const parsed = extractionSchema.parse(JSON.parse(response.choices[0]?.message?.content || "{}"));
    await writeCache(cacheKey, parsed);
    return parsed;
  }

  const fallback = deterministicExtract(rawText);
  await writeCache(cacheKey, fallback);
  return fallback;
}

export function deterministicExtract(rawText: string): ExtractedDecision {
  const lowered = rawText.toLowerCase();
  const tags = [...new Set(tokenize(rawText).filter((token) => token.length > 3))].slice(0, 7);
  const lifecycleHint = lowered.includes("moving away") || lowered.includes("reversed") || lowered.includes("rollback")
    ? "reversed"
    : lowered.includes("revisit") || lowered.includes("again") || lowered.includes("back to")
      ? "revisited"
      : lowered.includes("decided") || lowered.includes("chose")
        ? "decided"
        : "proposed";

  const alternatives: DecisionAlternative[] = [];
  for (const marker of ["instead of", "rather than", "rejected"]) {
    const idx = lowered.indexOf(marker);
    if (idx >= 0) {
      alternatives.push({
        name: rawText.slice(idx + marker.length, idx + marker.length + 80).trim() || "alternative",
        rejectedBecause: "Mentioned as a rejected or competing path in the source text."
      });
      break;
    }
  }

  const people = [...rawText.matchAll(/@([a-zA-Z0-9_-]+)/g)].map((match) => `@${match[1]}`);
  const scope = tags.find((tag) => ["billing", "auth", "analytics", "ci", "sdk", "webhooks", "integrations"].includes(tag)) || tags[0] || "engineering";

  return {
    decision: rawText.split(/[.\n]/)[0]?.trim() || rawText.slice(0, 160),
    rationale: lowered.includes("because") ? rawText.slice(lowered.indexOf("because"), lowered.indexOf("because") + 220) : "not stated",
    alternatives,
    caveats: lowered.includes("revisit") ? ["Source text says this may need revisiting."] : [],
    scope,
    people,
    tags,
    lifecycleHint
  };
}

export function buildRetainContent(record: DecisionRecord) {
  const alternatives = record.alternatives
    .map((alternative) => `${alternative.name} was rejected because ${alternative.rejectedBecause}`)
    .join(" ");
  const caveats = record.caveats.length ? ` Caveats: ${record.caveats.join(" ")}` : "";
  const lifecycle = record.lifecycle.map((event) => `${event.date}: ${event.state} - ${event.summary}`).join(" ");

  return `Engineering decision in ${record.scope}: On ${record.date}, ${record.people.join(", ") || "the team"} decided: ${record.decision} Rationale: ${record.rationale} ${alternatives}${caveats} Lifecycle: ${lifecycle} Source: ${record.source}. Tags: ${record.tags.join(", ")}.`;
}
