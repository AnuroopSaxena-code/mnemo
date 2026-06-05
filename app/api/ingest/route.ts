import { NextResponse } from "next/server";
import { z } from "zod";
import { retainDecision } from "@/lib/retain";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generateId } from "@/lib/crypto";

const schema = z.object({
  rawText: z.string().min(5),
  sourceType: z.enum(["github", "slack", "discord", "whatsapp", "adr", "manual", "seed"]).default("manual"),
  source: z.string().optional(),
  bankId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    
    // Resolve workspace session
    let targetBankId = body.bankId;
    let targetWorkspaceId = "";
    
    if (!targetBankId) {
      const session = getSession(request.headers.get("cookie"));
      if (session) {
        const workspace = await db.workspace.findUnique({
          where: { id: session.workspaceId }
        });
        if (workspace) {
          targetBankId = workspace.hindsightBankId;
          targetWorkspaceId = workspace.id;
        }
      }
    } else if (targetBankId === "mnemo") {
      targetWorkspaceId = "ws_demo"; // Seed / demo fallback
    }

    const result = await retainDecision(
      body.rawText, 
      body.sourceType, 
      body.source || "Manual review", 
      targetBankId
    );

    // Save to the relational database if we have a resolved workspace context
    if (targetWorkspaceId) {
      await db.decision.create({
        data: {
          id: generateId("dec"),
          workspaceId: targetWorkspaceId,
          hindsightId: result.record.id,
          title: result.record.title,
          decision: result.record.decision,
          rationale: result.record.rationale || "",
          alternatives: JSON.stringify(result.record.alternatives || []),
          caveats: (result.record.caveats || []).join(", "),
          scope: result.record.scope || "",
          people: (result.record.people || []).join(", "),
          source: body.sourceType,
          repoFullName: result.record.source.includes("/") ? result.record.source : "acme-devtools",
          state: result.record.state
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingestion failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to retain decision." }, 
      { status: 400 }
    );
  }
}
