import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { recall } from '@/lib/memory'
import { synthesiseAnswer } from '@/lib/groq'

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
    const { query } = await req.json()
    if (!query?.trim()) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const memories = await recall(workspace.hindsightBankId, query, 5)
    const answer = await synthesiseAnswer(query, memories)

    // Resolve vector citations to database records
    const hindsightIds = memories.map((m: any) => m.id).filter(Boolean)
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    })

    const evidence = memories.map((m: any) => {
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

    return NextResponse.json({
      mode: "with-memory",
      answer,
      evidence
    })
  } catch (err) {
    console.error('Failed to query memory:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
