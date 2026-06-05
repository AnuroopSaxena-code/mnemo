import { NextResponse } from "next/server";
import { z } from "zod";
import type { OnboardingBrief } from "@/lib/types";
import { recallRelevantMemories } from "@/lib/recall";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  service: z.string().min(2),
  bankId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    
    // Resolve workspace bankId from session cookie or payload
    let targetBankId = body.bankId;
    if (!targetBankId) {
      const session = getSession(request.headers.get("cookie"));
      if (session) {
        const workspace = await db.workspace.findUnique({
          where: { id: session.workspaceId }
        });
        if (workspace) {
          targetBankId = workspace.hindsightBankId;
        }
      }
    }

    const { memories, operations } = await recallRelevantMemories(
      `What decisions should a new engineer know before working on ${body.service}?`,
      { topK: 8 },
      targetBankId
    );
    const brief: OnboardingBrief = {
      service: body.service,
      summary: `Before touching ${body.service}, review these decisions because they encode the team's scars, reversals, and caveats.`,
      decisions: memories.map((memory) => ({
        title: memory.record?.title || memory.text.slice(0, 90),
        whyItMatters: memory.record?.rationale || memory.text,
        health: memory.health || { label: "Watch", score: 55, reasons: ["Imported from recalled Hindsight memory."] },
        source: memory.source || memory.id
      })),
      operations
    };
    return NextResponse.json(brief);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create onboarding brief." }, { status: 400 });
  }
}
