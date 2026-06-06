import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { recall } from '@/lib/memory'
import { resolveBotOrSession } from '@/lib/session'
import { generatePremortem, extractDecision } from '@/lib/groq'

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

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveBotOrSession(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { text, source, sourceName, repoFullName } = body
    const targetWorkspaceId = auth.isBot ? body.workspaceId : auth.workspaceId

    if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })
    if (!targetWorkspaceId) return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })

    const workspace = await db.workspace.findUnique({ where: { id: targetWorkspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // 1. Recall similar memories from Hindsight
    const allMemories = await recall(workspace.hindsightBankId, text, 15)
    const memories = repoFullName ? allMemories.filter((m: any) => m.metadata?.repo === repoFullName).slice(0, 5) : allMemories.slice(0, 5);

    // 2. Run Groq pre-mortem ALWAYS
    const premortem = await generatePremortem(text, memories)

    // 3. Extract structured decision
    const extracted = await extractDecision(text, `${source ?? 'manual'} in ${sourceName ?? 'unknown'}`)

    // 4. Resolve database records for recalled memories
    const hindsightIds = memories.map((m: any) => m.id).filter(Boolean)
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    })

    const evidence = memories.map((m: any) => {
      const dbDec = dbDecisions.find((d: any) => d.hindsightId === m.id)
      if (!dbDec) {
        return {
          id: m.id,
          text: m.content,
          record: {
            id: `inf_${m.id.substring(0, 8)}`,
            title: typeof m.content === 'string' ? m.content.slice(0, 50) + '...' : 'Codebase context',
            decision: "Inferred from codebase structure",
            rationale: "Codebase pattern detected",
            alternatives: [],
            caveats: [],
            scope: "global",
            people: [],
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            state: "active",
            sourceType: "github",
            source: "Inferred from code context",
            tags: [],
            reinforcementCount: 0,
            authorStatus: "active",
            lifecycle: [],
            content: m.content,
            inferred: true
          }
        }
      }
      return {
        id: m.id,
        text: m.content,
        record: mapDbDecisionToRecord(dbDec)
      }
    }).filter(Boolean)

    // 5. Build structured Pre-Mortem Result payload
    const paragraphs = premortem.split("\n\n").filter(Boolean)
    const rawHeadline = paragraphs[0]?.replace(/^headline:\s*/i, '').slice(0, 100) || "Pre-Mortem Risk Assessment"
    const isGenericFallback = rawHeadline.toLowerCase().includes("generic") || memories.length === 0;
    const headline = isGenericFallback ? "AI Generated Generic Risk Assessment" : rawHeadline;

    const summaryText = paragraphs[1] || premortem
    const hasConflict = memories.length > 0
    const warningLevel = hasConflict ? "critical" : "low"

    const failureModes = paragraphs.slice(2).map((p, idx) => ({
      risk: p.split("\n")[0]?.replace(/^risk:\s*/i, '').slice(0, 100) || `Risk Factor #${idx + 1}`,
      whyHistorySuggestsIt: p,
      mitigation: isGenericFallback ? "Review AI-generated suggestions and define guardrails before merging." : "Review historical precedent and define guardrails before merging.",
      citations: isGenericFallback ? [] : evidence.slice(0, 2).map((e: any) => e.record.id)
    }))

    const operations = [
      { label: "Recall before retain", state: "complete" as const, detail: `${memories.length} historical decisions fetched from index.` },
      { label: "Groq pre-mortem", state: "complete" as const, detail: isGenericFallback ? "Generated generic risks via AI (no history found)." : "Identified potential integration and scalability risks based on history." }
    ]

    return NextResponse.json({
      warningLevel,
      headline,
      summary: summaryText,
      failureModes,
      evidence,
      operations,
      extraction: {
        decision: extracted.split("\n")[0]?.replace(/^DECISION:\s*/i, '') || extracted,
        rationale: "extracted",
        alternatives: [],
        caveats: [],
        scope: "global",
        people: [],
        tags: [],
        lifecycleHint: "proposed"
      }
    })
  } catch (err) {
    console.error('Failed to run pre-mortem:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
