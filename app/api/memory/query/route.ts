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
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { query, repoFullName } = await req.json()
    if (!query?.trim()) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const allMemories = await recall(workspace.hindsightBankId, query, 15)
    const memories = repoFullName ? allMemories.filter((m: any) => m.metadata?.repoFullName === repoFullName).slice(0, 5) : allMemories.slice(0, 5);
    if (memories.length === 0) {
      return NextResponse.json({
        mode: "with-memory",
        answer: "Nothing stored on that. Either it predates the integration or nobody wrote it down.",
        evidence: []
      })
    }

    const answer = await synthesiseAnswer(query, memories)

    // Resolve vector citations to database records
    const hindsightIds = memories.map((m: any) => m.id).filter(Boolean)
    const dbDecisions = await db.decision.findMany({
      where: { hindsightId: { in: hindsightIds } }
    })

    const evidence = memories.map((m: any) => {
      const dbDec = dbDecisions.find((d: any) => d.hindsightId === m.id)
      if (!dbDec) return null
      return {
        id: m.id,
        text: m.content,
        record: mapDbDecisionToRecord(dbDec)
      }
    }).filter(Boolean)

    return NextResponse.json({
      mode: "with-memory",
      answer,
      evidence
    })
  } catch (err: any) {
    console.error('Failed to query memory:', err)
    return NextResponse.json({
      error: 'Internal server error',
      details: err?.message || String(err),
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined
    }, { status: 500 })
  }
}
