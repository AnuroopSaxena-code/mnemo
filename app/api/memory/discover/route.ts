import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recall } from "@/lib/memory";
import { groq, MODEL } from "@/lib/groq";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { repoFullName } = await request.json();

    const workspace = await db.workspace.findUnique({
      where: { id: session.workspaceId }
    });

    if (!workspace || !workspace.hindsightBankId) {
      return NextResponse.json({ error: "Memory bank not configured." }, { status: 400 });
    }

    // Query for architectural patterns
    const query = "Core architecture, libraries, infrastructure, and main design patterns of the codebase.";
    const allMemories = await recall(workspace.hindsightBankId, query, 30);
    const memories = repoFullName ? allMemories.filter((m: any) => m.metadata?.repoFullName === repoFullName).slice(0, 10) : allMemories.slice(0, 10);

    if (memories.length === 0) {
      return NextResponse.json({ discovered: [] });
    }

    // Filter out memories that already have a linked decision
    const hindsightIds = memories.map((m: any) => m.id).filter(Boolean);
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    });

    const unknownMemories = memories.filter((m: any) => !dbDecisions.some(d => d.hindsightId === m.id));

    if (unknownMemories.length === 0) {
      return NextResponse.json({ discovered: [] });
    }

    // Truncate to avoid token limits
    const safeMemories = unknownMemories.map((m: any) => ({
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
          content: "You are an AI architect. Extract 3 to 5 undocumented technical decisions from the following raw code chunks. Output strictly in JSON format: { \"decisions\": [ { \"decision\": \"...\", \"rationale\": \"...\", \"scope\": \"...\", \"caveats\": [\"...\"], \"hindsightId\": \"...\" } ] }. Provide the hindsightId from the source chunk ID that best represents this decision."
        },
        {
          role: "user",
          content: `Code Snippets:\n${JSON.stringify(safeMemories)}`
        }
      ]
    });

    let discovered = [];
    if (completion.choices[0].message.content) {
      const parsed = JSON.parse(completion.choices[0].message.content);
      if (parsed.decisions && Array.isArray(parsed.decisions)) {
        discovered = parsed.decisions.map((d: any) => ({
          decision: d.decision,
          rationale: d.rationale,
          scope: d.scope || "global",
          caveats: Array.isArray(d.caveats) ? d.caveats : [],
          alternatives: [],
          hindsightId: d.hindsightId || null,
          source: "Inferred from codebase structure",
          inferred: true
        }));
      }
    }

    return NextResponse.json({ discovered });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to discover decisions." }, { status: 500 });
  }
}
