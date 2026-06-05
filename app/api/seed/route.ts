import { NextResponse } from "next/server";
import { buildRetainContent } from "@/lib/extraction";
import { getHindsightClient, hasHindsightKey, HINDSIGHT_BANK_ID } from "@/lib/hindsight";
import { retainLocalDecision } from "@/lib/local-memory";
import { seedDecisions } from "@/lib/seed-decisions";
import { db } from "@/lib/db";

export async function GET() {
  return POST();
}

export async function POST() {
  if (process.env.ENABLE_SEED_ROUTE === "false") {
    return NextResponse.json({ error: "Seed route is disabled." }, { status: 403 });
  }

  try {
    // 1. Ensure the default demo workspace exists in the SQLite database
    let workspace = await db.workspace.findUnique({ where: { id: "ws_demo" } });
    if (!workspace) {
      workspace = await db.workspace.create({
        data: {
          id: "ws_demo",
          name: "Demo Workspace",
          hindsightBankId: HINDSIGHT_BANK_ID
        }
      });
    }

    // 2. Clear previous seed decisions and bulk insert new ones in SQLite database
    await db.decision.deleteMany({ where: { workspaceId: "ws_demo" } });
    
    await db.decision.createMany({
      data: seedDecisions.map((decision) => ({
        id: decision.id,
        workspaceId: "ws_demo",
        hindsightId: decision.id,
        title: decision.title,
        decision: decision.decision,
        rationale: decision.rationale || "",
        alternatives: JSON.stringify(decision.alternatives || []),
        caveats: (decision.caveats || []).join(", "),
        scope: decision.scope || "",
        people: (decision.people || []).join(", "),
        source: decision.sourceType,
        repoFullName: decision.source.includes("/") ? decision.source : "acme-devtools", // default demo repo
        state: decision.state
      }))
    });

    // 3. Populate memory indexes (local keyword memory and Hindsight Cloud)
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

    return NextResponse.json({ 
      count: results.length, 
      databaseSeeded: true,
      results 
    });
  } catch (err: any) {
    console.error("Seeding failed:", err);
    return NextResponse.json({ error: err.message || "Internal seeding error" }, { status: 500 });
  }
}
