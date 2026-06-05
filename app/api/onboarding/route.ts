import { NextResponse } from "next/server";
import { z } from "zod";
import type { OnboardingBrief } from "@/lib/types";
import { recall } from "@/lib/memory";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { scoreDecisionHealth } from "@/lib/health";

const schema = z.object({
  service: z.string().min(2),
  bankId: z.string().optional()
});

function mapDbDecisionToRecord(d: any) {
  return {
    id: d.id,
    title: d.summary.length > 60 ? d.summary.slice(0, 60) + '...' : d.summary,
    decision: d.summary,
    rationale: d.rationale || "not stated",
    alternatives: [],
    caveats: d.caveats ? d.caveats.split(",").map((c: string) => c.trim()) : [],
    scope: d.scope || "global",
    people: [d.author],
    date: new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    state: d.status as any,
    sourceType: d.source.includes('github') ? 'github' : d.source.includes('slack') ? 'slack' : d.source.includes('discord') ? 'discord' : 'manual',
    source: d.source,
    sourceUrl: d.sourceUrl || undefined,
    tags: d.scope ? [d.scope] : [],
    reinforcementCount: 0,
    authorStatus: "active" as const,
    lifecycle: [
      {
        id: `evt_${d.id}`,
        state: d.status as any,
        date: new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        title: "Decision Recorded",
        summary: d.summary,
        source: d.source
      }
    ],
    content: d.summary
  }
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    
    // Resolve workspace bankId from session cookie or payload
    let targetBankId = body.bankId;
    if (!targetBankId) {
      const session = await getSession();
      if (session) {
        const workspace = await db.workspace.findUnique({
          where: { id: session.workspaceId }
        });
        if (workspace) {
          targetBankId = workspace.hindsightBankId;
        }
      }
    }

    if (!targetBankId) {
      return NextResponse.json({ error: "Memory bank ID not found." }, { status: 400 });
    }

    const query = `What decisions should a new engineer know before working on ${body.service}?`;
    const memories = await recall(targetBankId, query, 8);

    // Resolve vector citations to database records
    const hindsightIds = memories.map((m: any) => m.id).filter(Boolean);
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    });

    const decisions = memories.map((m: any) => {
      const dbDec = dbDecisions.find(d => d.hindsightId === m.id);
      const record = dbDec ? mapDbDecisionToRecord(dbDec) : {
        id: m.id,
        title: m.content.slice(0, 60),
        decision: m.content,
        rationale: "not stated",
        alternatives: [],
        caveats: [],
        scope: "global",
        people: [m.metadata?.author || "unknown"],
        date: m.metadata?.timestamp ? new Date(m.metadata.timestamp).toLocaleDateString() : "recent",
        state: "standing" as const,
        sourceType: "manual" as const,
        source: "manual",
        tags: [],
        reinforcementCount: 0,
        authorStatus: "active" as const,
        lifecycle: [],
        content: m.content
      };

      const health = scoreDecisionHealth(record as any);

      return {
        title: record.title,
        whyItMatters: record.rationale || record.decision,
        health,
        source: record.source
      };
    });

    const brief: OnboardingBrief = {
      service: body.service,
      summary: `Before touching ${body.service}, review these decisions because they encode the team's scars, reversals, and caveats.`,
      decisions,
      operations: [
        { label: "Recall target workspace", state: "complete" as const, detail: `Fetched ${memories.length} memories for ${body.service}.` },
        { label: "Health analysis", state: "complete" as const, detail: "Analyzed stability of relevant architectural decisions." }
      ]
    };

    return NextResponse.json(brief);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create onboarding brief." }, { status: 400 });
  }
}
