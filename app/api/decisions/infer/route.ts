import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { recall } from '@/lib/memory'
import { groq, MODEL } from '@/lib/groq'

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { repoFullName } = await request.json();
    const workspace = await db.workspace.findUnique({
      where: { id: session.workspaceId }
    })
    if (!workspace || !workspace.hindsightBankId) {
      return NextResponse.json({ error: "Memory bank not configured." }, { status: 400 });
    }

    // Query for architectural patterns to infer history
    const query = "Core architecture, libraries, infrastructure, and main design patterns of the codebase.";
    const memories = await recall(workspace.hindsightBankId, query, 30);
    
    // Filter memories by the current repository
    const repoMemories = memories.filter((m: any) => m.metadata?.repo === repoFullName);



    const safeMemories = repoMemories.map((m: any) => ({
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
          content: "You are an AI architect. Infer a historical timeline of 5-8 technical decisions based on these raw code snippets. If snippets are empty, generate 5 foundational Day-1 decisions for setting up a standard web project. Output strictly in JSON format: { \"decisions\": [ { \"title\": \"...\", \"decision\": \"...\", \"rationale\": \"...\", \"scope\": \"...\", \"source\": \"...\" } ] }. Provide a logical title, what was decided, rationale, scope, and use 'Inferred from codebase structure' (or 'AI Generated Generic Best Practice' if snippets are empty) as the source."
        },
        {
          role: "user",
          content: `Code Snippets:\n${JSON.stringify(safeMemories)}`
        }
      ]
    });

    let inferred = [];
    if (completion.choices[0].message.content) {
      const parsed = JSON.parse(completion.choices[0].message.content);
      if (parsed.decisions && Array.isArray(parsed.decisions)) {
        inferred = parsed.decisions.map((d: any, idx: number) => {
          const mockId = `inf_tl_${Date.now()}_${idx}`;
          const date = new Date();
          date.setDate(date.getDate() - (idx * 5)); // space them out
          const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

          return {
            id: mockId,
            title: d.title || `Inferred Decision #${idx+1}`,
            decision: d.decision,
            rationale: d.rationale || "Inferred from code structure",
            alternatives: [],
            caveats: [],
            scope: d.scope || "global",
            people: [],
            date: dateStr,
            state: "active",
            sourceType: "manual",
            source: d.source || "Inferred from codebase",
            sourceUrl: undefined,
            tags: d.scope ? [d.scope] : [],
            reinforcementCount: 0,
            authorStatus: "active",
            lifecycle: [
              {
                id: `evt_${mockId}`,
                state: "active",
                date: dateStr,
                title: "Pattern Inferred",
                summary: d.decision,
                source: "Codebase Context"
              }
            ],
            content: d.decision,
            inferred: true
          };
        });
      }
    }

    return NextResponse.json({ inferred });
  } catch (err) {
    console.error('Failed to infer decisions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
