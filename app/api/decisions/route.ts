import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const repoFullName = searchParams.get('repoFullName')

  try {
    let whereClause: any = { workspaceId: session.workspaceId }
    if (repoFullName) {
      whereClause.repoFullName = repoFullName
    }

    let decisions = await db.decision.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formatted = decisions.map((d: any) => ({
      id: d.id,
      title: d.summary.length > 60 ? d.summary.slice(0, 60) + '...' : d.summary,
      decision: d.summary,
      rationale: d.rationale || "not stated",
      alternatives: [],
      caveats: d.caveats ? d.caveats.split(",").map((c: any) => c.trim()) : [],
      scope: d.scope || "global",
      people: [d.author],
      date: new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      state: d.status as any,
      sourceType: (d.source.includes('github') ? 'github' : d.source.includes('slack') ? 'slack' : d.source.includes('discord') ? 'discord' : 'manual') as any,
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
    }))

    return NextResponse.json({ decisions: formatted })
  } catch (err) {
    console.error('Failed to fetch decisions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
