import type { FailureMode, OperationBadge, PremortemResult, RecalledMemory, SourceType, WarningLevel } from "@/lib/types";
import { extractDecision } from "@/lib/extraction";
import { aggregateHealth } from "@/lib/health";
import { recallRelevantMemories } from "@/lib/recall";
import { getGroqClient, GROQ_MODEL_SYNTHESIS, hasGroqKey } from "@/lib/groq";
import { readCache, writeCache } from "@/lib/cache";
import { stableHash } from "@/lib/text";

export async function generatePremortem(rawText: string, sourceType: SourceType, bankId?: string): Promise<PremortemResult> {
  const extraction = await extractDecision(rawText, sourceType);
  const recallQuery = `${extraction.decision} ${extraction.rationale} ${extraction.scope} ${extraction.tags.join(" ")}`;
  const { memories, operations } = await recallRelevantMemories(recallQuery, { topK: 5 }, bankId);
  const health = aggregateHealth(memories);
  const warningLevel = warningFromMemories(memories, health.label);
  const lifecycle = memories.flatMap((memory) => memory.record?.lifecycle || []).slice(0, 8);
  const premortem = await synthesizePremortem(rawText, memories, warningLevel, operations);

  return {
    warningLevel,
    headline: premortem.headline,
    summary: premortem.summary,
    failureModes: premortem.failureModes,
    evidence: memories,
    lifecycle,
    health,
    operations: [
      ...operations,
      {
        label: "Recall before retain",
        state: "complete",
        detail: "Mnemo checked institutional memory before storing the new proposal."
      },
      premortem.operation
    ],
    extraction
  };
}

function warningFromMemories(memories: RecalledMemory[], label: string): WarningLevel {
  if (memories.some((memory) => memory.record?.state === "reversed") || label === "Reversed") return "critical";
  if (memories.some((memory) => memory.record?.state === "stale")) return "high";
  if (memories.length >= 3) return "medium";
  return "low";
}

/** Build a structured memory context block for the LLM — one entry per recalled memory. */
function buildMemoryContext(memories: RecalledMemory[]): string {
  return memories
    .slice(0, 4)
    .map((memory, index) => {
      const record = memory.record;
      const meta = [
        record?.state ? `state: ${record.state}` : null,
        record?.date ? `date: ${record.date}` : null,
        record?.people?.length ? `people: ${record.people.join(", ")}` : null,
        memory.health ? `health: ${memory.health.label} (score ${memory.health.score})` : null
      ]
        .filter(Boolean)
        .join(" | ");
      return `[MEMORY ${index + 1}: ${memory.id}]${meta ? `\nMeta: ${meta}` : ""}\n${memory.text}`;
    })
    .join("\n\n---\n\n");
}

const PREMORTEM_SYSTEM_PROMPT = `You are Mnemo, an engineering pre-mortem agent backed by institutional memory.
Your job is to write a concise, concrete pre-mortem for an incoming proposal using ONLY the recalled memories provided.
Never invent facts or experiences not found in the memories.

Warning level meanings:
  low      → minor overlap; note similarities for awareness only
  medium   → meaningful overlap; flag assumptions that may not hold
  high     → a stale or expired decision is being recycled; strong caution needed
  critical → this proposal repeats a decision that was explicitly REVERSED or caused an incident

Output format — return a JSON object with exactly these keys:
{
  "headline": "One sharp sentence (≤15 words) summarising the biggest risk. If critical, name the reversal.",
  "summary": "2-3 sentences. Name the overlapping memory, state the date it happened, and say specifically what went wrong or what caveats apply.",
  "failureModes": [
    {
      "risk": "Short label for the failure mode (≤12 words)",
      "whyHistorySuggestsIt": "A sentence grounded in a specific recalled memory — name the memory ID in brackets.",
      "mitigation": "A concrete action the PR author can take before merging.",
      "citations": ["memory-id-1"]
    }
  ]
}

Rules:
- Provide exactly 3 failureModes.
- If a memory has state=reversed, the first failureMode MUST explicitly call it out: "This mirrors [title], which was reversed on [date]."
- Ground every whyHistorySuggestsIt in a specific memory. Do not write generic engineering advice.
- Keep the entire response under 900 tokens.
- Do not include markdown, code fences, or any wrapper text — return raw JSON only.`;

async function synthesizePremortem(
  rawText: string,
  memories: RecalledMemory[],
  warningLevel: WarningLevel,
  operations: OperationBadge[]
): Promise<{ headline: string; summary: string; failureModes: FailureMode[]; operation: OperationBadge }> {
  const cacheKey = `premortem-${stableHash(`${rawText}:${memories.map((memory) => memory.id).join(",")}`)}`;
  const cached = await readCache<{ headline: string; summary: string; failureModes: FailureMode[] }>(cacheKey);
  if (cached) {
    return {
      ...cached,
      operation: { label: "Groq pre-mortem", state: "complete", detail: "Loaded cached Groq pre-mortem." }
    };
  }

  if (hasGroqKey()) {
    const memoryContext = buildMemoryContext(memories);
    const response = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL_SYNTHESIS,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PREMORTEM_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Warning level: ${warningLevel}\n\nIncoming proposal:\n${rawText.slice(0, 2400)}\n\nRecalled memories:\n${memoryContext}`
        }
      ]
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}") as {
      headline?: string;
      summary?: string;
      failureModes?: Array<{
        risk?: string;
        whyHistorySuggestsIt?: string;
        why?: string; // tolerate mis-named key from model
        mitigation?: string;
        citations?: string[];
      }>;
    };
    const result = normalizePremortem(parsed, memories, warningLevel);
    await writeCache(cacheKey, result);
    return {
      ...result,
      operation: { label: "Groq pre-mortem", state: "complete", detail: `Generated with ${GROQ_MODEL_SYNTHESIS} using top recalled memories.` }
    };
  }

  const fallback = fallbackPremortem(memories, warningLevel);
  await writeCache(cacheKey, fallback);
  return {
    ...fallback,
    operation: {
      label: "Groq pre-mortem",
      state: "warning",
      detail: "GROQ_API_KEY is missing; used deterministic fallback so the UI remains demoable."
    }
  };
}

function normalizePremortem(
  parsed: {
    headline?: string;
    summary?: string;
    failureModes?: Array<{ risk?: string; whyHistorySuggestsIt?: string; why?: string; mitigation?: string; citations?: string[] }>;
  },
  memories: RecalledMemory[],
  warningLevel: WarningLevel
) {
  const fallback = fallbackPremortem(memories, warningLevel);
  return {
    headline: parsed.headline || fallback.headline,
    summary: parsed.summary || fallback.summary,
    failureModes:
      parsed.failureModes?.slice(0, 3).map((mode) => ({
        risk: mode.risk || "Risk not specified",
        // Tolerate wrong key name from model output
        whyHistorySuggestsIt: mode.whyHistorySuggestsIt || mode.why || "The recalled memory suggests this needs review.",
        mitigation: mode.mitigation || "Ask the decision owner to confirm assumptions before merge.",
        citations: mode.citations?.length ? mode.citations : [memories[0]?.id || "local-memory"]
      })) || fallback.failureModes
  };
}

function fallbackPremortem(memories: RecalledMemory[], warningLevel: WarningLevel) {
  const top = memories[0];
  const title = top?.record?.title || "No close prior decision found";
  const reversedMemory = memories.find((m) => m.record?.state === "reversed");
  return {
    headline:
      warningLevel === "critical"
        ? `Engineering déjà vu: this mirrors "${reversedMemory?.record?.title || title}", which was reversed`
        : "Pre-mortem generated from recalled engineering memory",
    summary: top
      ? `This proposal overlaps with "${title}" (${top.record?.date || "unknown date"}). Before merge, verify the old caveats no longer apply and that the new context is intentionally different.`
      : "Mnemo did not find strong matching memory. Treat this as a normal architecture review and retain the outcome for future recall.",
    failureModes: [
      {
        risk: top?.record?.state === "reversed" ? `Repeating "${title}", a rolled-back path.` : "Reusing an assumption that may no longer hold.",
        whyHistorySuggestsIt: top?.text || "No strong memory was recalled.",
        mitigation: "Explicitly name the difference from the old decision in the PR description before merging.",
        citations: [top?.id || "local-memory"]
      },
      {
        risk: "Missing the rejected alternative that drove the original tradeoff.",
        whyHistorySuggestsIt: top?.record?.alternatives[0]?.rejectedBecause || "Past alternatives were not available in recalled memory.",
        mitigation: "Explicitly state why the previously rejected path is safe now.",
        citations: [top?.id || "local-memory"]
      },
      {
        risk: "Ignoring caveats or expiry conditions.",
        whyHistorySuggestsIt: top?.record?.caveats[0] || "No caveat was found in the recalled memory.",
        mitigation: "Turn caveats into merge checks or follow-up tasks before closing the PR.",
        citations: [top?.id || "local-memory"]
      }
    ]
  };
}
