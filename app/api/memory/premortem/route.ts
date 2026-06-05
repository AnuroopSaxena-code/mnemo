import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { recall } from '@/lib/memory'
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
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text, source, sourceName } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })

    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // 1. Recall similar memories from Hindsight
    const memories = await recall(workspace.hindsightBankId, text, 5)

    // 2. Run Groq pre-mortem
    const premortem = await generatePremortem(text, memories)

    // 3. Extract structured decision
    const extracted = await extractDecision(text, `${source ?? 'manual'} in ${sourceName ?? 'unknown'}`)

    // 4. Resolve database records for recalled memories
    const hindsightIds = memories.map((m: any) => m.id).filter(Boolean)
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    })

    const evidence = memories.map((m: any, idx: number) => {
      const dbDec = dbDecisions.find((d: any) => d.hindsightId === m.id)
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
        state: "standing",
        sourceType: "manual" as const,
        source: "manual",
        tags: [],
        reinforcementCount: 0,
        authorStatus: "active" as const,
        lifecycle: [],
        content: m.content
      }
      return {
        id: m.id,
        text: m.content,
        record
      }
    })

    // 5. Build structured Pre-Mortem Result payload
    const paragraphs = premortem.split("\n\n").filter(Boolean)
    const headline = paragraphs[0]?.replace(/^headline:\s*/i, '').slice(0, 100) || "Pre-Mortem Risk Assessment"
    const summaryText = paragraphs[1] || premortem
    const hasConflict = memories.length > 0
    const warningLevel = hasConflict ? "critical" : "low"

    const failureModes = paragraphs.slice(2).map((p, idx) => ({
      risk: p.split("\n")[0]?.replace(/^risk:\s*/i, '').slice(0, 100) || `Risk Factor #${idx + 1}`,
      whyHistorySuggestsIt: p,
      mitigation: "Review historical precedent and define guardrails before merging.",
      citations: evidence.slice(0, 2).map((e: any) => e.record.id)
    }))

    const operations = [
      { label: "Recall before retain", state: "complete" as const, detail: `${memories.length} historical decisions fetched from index.` },
      { label: "Groq pre-mortem", state: "complete" as const, detail: "Identified potential integration and scalability risks." }
    ]

    return NextResponse.json({
      warningLevel,
      headline,
      summary: summaryText,
      failureModes: failureModes.length > 0 ? failureModes : [
        {
          risk: "General System Drift",
          whyHistorySuggestsIt: premortem,
          mitigation: "Ensure compliance with existing architectural guidelines.",
          citations: []
        }
      ],
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
