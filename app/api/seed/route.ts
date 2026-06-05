import { NextResponse } from "next/server";
import { buildRetainContent } from "@/lib/extraction";
import { getHindsightClient, hasHindsightKey, HINDSIGHT_BANK_ID } from "@/lib/hindsight";
import { retainLocalDecision } from "@/lib/local-memory";
import { seedDecisions } from "@/lib/seed-decisions";

export async function GET() {
  return POST();
}

export async function POST() {
  if (process.env.ENABLE_SEED_ROUTE === "false") {
    return NextResponse.json({ error: "Seed route is disabled." }, { status: 403 });
  }

  const promises = seedDecisions.map(async (decision) => {
    await retainLocalDecision(decision);
    if (!hasHindsightKey()) {
      return { id: decision.id, state: "local" as const, detail: "No Hindsight key; seeded local memory only." };
    }
    try {
      const client = getHindsightClient();
      await client.retain(HINDSIGHT_BANK_ID, buildRetainContent(decision), {
        context: "engineering decision - seed history",
        timestamp: new Date(decision.date),
        metadata: {
          document_id: decision.id,
          source_type: decision.sourceType,
          source: decision.source,
          scope: decision.scope,
          state: decision.state,
          tags: decision.tags.join(",")
        }
      });
      return { id: decision.id, state: "hindsight" as const, detail: `Retained to ${HINDSIGHT_BANK_ID}.` };
    } catch (error) {
      return {
        id: decision.id,
        state: "error" as const,
        detail: error instanceof Error ? error.message : "Unable to retain seed decision."
      };
    }
  });

  const results = await Promise.all(promises);

  return NextResponse.json({ count: results.length, results });
}
