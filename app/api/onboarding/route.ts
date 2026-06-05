import { NextResponse } from "next/server";
import { z } from "zod";
import type { OnboardingBrief } from "@/lib/types";
import { recall } from "@/lib/memory";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { scoreDecisionHealth } from "@/lib/health";
import { groq, MODEL } from "@/lib/groq";

const schema = z.object({
  service: z.string().min(2),
  bankId: z.string().optional(),
  repoFullName: z.string().optional()
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
    const memories = await recall(targetBankId, query, 30);
    const repoMemories = body.repoFullName ? memories.filter((m: any) => m.metadata?.repoFullName === body.repoFullName) : memories;

    const hindsightIds = repoMemories.map((m: any) => m.id).filter(Boolean);
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    });

    const explicitDecisions = [];
    const unknownMemories = [];

    for (const m of repoMemories) {
      const dbDec = dbDecisions.find((d: any) => d.hindsightId === m.id);
      if (dbDec) {
        const record = mapDbDecisionToRecord(dbDec);
        const health = scoreDecisionHealth(record as any);
        explicitDecisions.push({
          title: record.title,
          whyItMatters: record.rationale || record.decision,
          health,
          source: record.source,
          inferred: false
        });
      } else {
        unknownMemories.push(m);
      }
    }

    let inferredDecisions: any[] = [];
    if (unknownMemories.length > 0) {
      try {
        // Truncate memory content to avoid token limits
        const safeMemories = unknownMemories.map(m => ({
          id: m.id,
          content: typeof m.content === 'string' ? m.content.slice(0, 1000) : m.content
        }));

        const completion = await groq.chat.completions.create({
          model: MODEL,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an AI architect. Extract 1 to 3 critical architectural or technical decisions from the following raw code chunks. Output strictly in JSON format: { \"decisions\": [ { \"title\": \"...\", \"rationale\": \"...\" } ] }"
            },
            {
              role: "user",
              content: `Code Snippets:\n${JSON.stringify(safeMemories)}`
            }
          ]
        });

        if (completion.choices[0].message.content) {
          const parsed = JSON.parse(completion.choices[0].message.content);
          if (parsed.decisions && Array.isArray(parsed.decisions)) {
            inferredDecisions = parsed.decisions.map((d: any) => ({
              title: d.title,
              whyItMatters: d.rationale,
              health: { label: "Watch", score: 50 }, // Inferred health is provisional
              source: "Inferred from Codebase",
              inferred: true
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to generate inferred decisions:", err);
      }
    }

    const allDecisions = [...explicitDecisions, ...inferredDecisions].slice(0, 5);

    let summary = `Before touching ${body.service}, review these structural patterns and recorded decisions to understand the system.`;
    if (allDecisions.length > 0) {
      try {
        const completion = await groq.chat.completions.create({
          model: MODEL,
          temperature: 0.2,
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content: "You are Mnemo. Summarize in one clear, concise sentence what a new engineer should look out for regarding these technical decisions."
            },
            {
              role: "user",
              content: `Service: ${body.service}\nDecisions: ${JSON.stringify(allDecisions.map(d => d.title))}`
            }
          ]
        });
        if (completion.choices[0].message.content) {
          summary = completion.choices[0].message.content;
        }
      } catch (err) {
        console.warn("Failed to generate dynamic onboarding summary:", err);
      }
    }

    const brief = {
      service: body.service,
      summary,
      decisions: allDecisions,
      operations: [
        { label: "Recall target workspace", state: "complete" as const, detail: `Fetched ${memories.length} memory chunks.` },
        { label: "Codebase Inference", state: inferredDecisions.length > 0 ? "complete" : "skipped" as const, detail: inferredDecisions.length > 0 ? `Inferred ${inferredDecisions.length} patterns directly from unmapped code.` : "All context mapped to explicit database records." },
        { label: "Health analysis", state: "complete" as const, detail: "Analyzed stability of relevant architectural decisions." }
      ]
    };

    return NextResponse.json(brief);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create onboarding brief." }, { status: 400 });
  }
}
