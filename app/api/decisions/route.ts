import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { seedWorkspace } from '@/lib/seed'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let decisions = await db.decision.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (decisions.length === 0) {
      const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
      if (workspace) {
        const repos = await db.repo.findMany({ where: { workspaceId: session.workspaceId } })
        const repoName = repos[0]?.fullName || `${session.user.githubLogin}/mnemo`
        await seedWorkspace(session.workspaceId, workspace.hindsightBankId, repoName)
        decisions = await db.decision.findMany({
          where: { workspaceId: session.workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      }
    }

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
