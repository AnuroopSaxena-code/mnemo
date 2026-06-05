import type { DecisionRecord, OperationBadge, RecalledMemory } from "@/lib/types";
import { getHindsightClient, hasHindsightKey, HINDSIGHT_BANK_ID } from "@/lib/hindsight";
import { readLocalDecisions } from "@/lib/local-memory";
import { scoreDecisionHealth } from "@/lib/health";
import { keywordScore } from "@/lib/text";

interface RecallOptions {
  topK?: number;
  forceLocal?: boolean;
}

export async function recallRelevantMemories(query: string, options: RecallOptions = {}, bankId?: string) {
  const operations: OperationBadge[] = [];
  const topK = options.topK || 5;
  const local = await localRecall(query, topK);

  const targetBankId = bankId || HINDSIGHT_BANK_ID;

  if (hasHindsightKey() && !options.forceLocal) {
    try {
      const client = getHindsightClient();
      const result = await client.recall(targetBankId, query, { maxTokens: 2600, budget: "mid" });
      const memories: RecalledMemory[] = (result.results || []).slice(0, topK).map((memory: any, index: number) => {
        const matchingRecord = local[index]?.record;
        return {
          id: String(memory.id || matchingRecord?.id || `hindsight-${index}`),
          text: String(memory.text || ""),
          type: memory.type,
          context: memory.context,
          mentionedAt: memory.mentioned_at || memory.mentionedAt,
          source: matchingRecord?.source || memory.context || "Hindsight recall",
          record: matchingRecord,
          health: matchingRecord ? scoreDecisionHealth(matchingRecord) : undefined
        };
      });
      const merged = mergeRecall(memories, local).slice(0, topK);
      operations.push({
        label: "Hindsight recall",
        state: "complete",
        detail: `Recalled ${memories.length} memories from ${targetBankId}.`
      });
      return { memories: merged, operations };
    } catch (error) {
      operations.push({
        label: "Hindsight recall",
        state: "warning",
        detail: error instanceof Error ? error.message : "Hindsight recall failed; using local demo memory."
      });
    }
  } else {
    operations.push({
      label: "Hindsight recall",
      state: "skipped",
      detail: "HINDSIGHT_API_KEY is not configured; using local seeded memory."
    });
  }

  operations.push({
    label: "Local fallback",
    state: "complete",
    detail: `Ranked ${local.length} seeded decisions without external calls.`
  });
  return { memories: local, operations };
}

async function localRecall(query: string, topK: number): Promise<RecalledMemory[]> {
  const decisions = await readLocalDecisions();
  return decisions
    .map((record) => ({ record, score: keywordScore(query, record) }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, topK)
    .map(({ record }) => ({
      id: record.id,
      text: record.content,
      type: "world",
      context: record.scope,
      mentionedAt: record.date,
      source: record.source,
      record,
      health: scoreDecisionHealth(record)
    }));
}

function mergeRecall(primary: RecalledMemory[], fallback: RecalledMemory[]) {
  const byId = new Map<string, RecalledMemory>();
  for (const memory of [...primary, ...fallback]) byId.set(memory.id, { ...byId.get(memory.id), ...memory });
  return [...byId.values()];
}
