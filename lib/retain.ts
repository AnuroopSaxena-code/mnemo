import type { DecisionRecord, OperationBadge, SourceType } from "@/lib/types";
import { extractDecision, buildRetainContent } from "@/lib/extraction";
import { getHindsightClient, hasHindsightKey, HINDSIGHT_BANK_ID } from "@/lib/hindsight";
import { retainLocalDecision } from "@/lib/local-memory";
import { stableHash } from "@/lib/text";

export async function retainDecision(rawText: string, sourceType: SourceType, source = "Manual review") {
  const extraction = await extractDecision(rawText, sourceType);
  const now = new Date().toISOString();
  const date = extraction.date || now.slice(0, 10);
  const record: DecisionRecord = {
    id: `mem-${stableHash(`${rawText}:${date}`).slice(0, 12)}`,
    title: extraction.decision.slice(0, 86),
    decision: extraction.decision,
    rationale: extraction.rationale,
    alternatives: extraction.alternatives,
    caveats: extraction.caveats,
    scope: extraction.scope,
    people: extraction.people,
    date,
    state: extraction.lifecycleHint,
    sourceType,
    source,
    tags: extraction.tags,
    reinforcementCount: 0,
    authorStatus: "unknown",
    lifecycle: [
      {
        id: `evt-${stableHash(rawText).slice(0, 10)}`,
        state: extraction.lifecycleHint,
        date,
        title: extraction.decision.slice(0, 72),
        summary: extraction.rationale,
        source
      }
    ],
    content: ""
  };
  record.content = buildRetainContent(record);

  const operations: OperationBadge[] = [];
  await retainLocalDecision(record);
  operations.push({ label: "Local retain", state: "complete", detail: "Saved to local demo memory." });

  if (hasHindsightKey()) {
    try {
      const client = getHindsightClient();
      await client.retain(HINDSIGHT_BANK_ID, record.content, {
        context: `engineering decision - ${sourceType}`,
        timestamp: new Date(date),
        metadata: {
          document_id: record.id,
          source_type: sourceType,
          scope: record.scope,
          source,
          state: record.state,
          tags: record.tags.join(",")
        }
      });
      operations.push({ label: "Hindsight retain", state: "complete", detail: `Retained to ${HINDSIGHT_BANK_ID}.` });
    } catch (error) {
      operations.push({
        label: "Hindsight retain",
        state: "error",
        detail: error instanceof Error ? error.message : "Failed to retain to Hindsight."
      });
    }
  } else {
    operations.push({
      label: "Hindsight retain",
      state: "warning",
      detail: "HINDSIGHT_API_KEY is not configured; retained locally only."
    });
  }

  return { record, operations, extraction };
}
