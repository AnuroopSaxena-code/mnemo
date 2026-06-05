import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { ingestDecision } from '@/lib/ingest'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text, extractedText, source, sourceUrl, repoFullName, sourceName, author } = await req.json()

    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const finalSource = sourceName ? `${source ?? 'manual'} (${sourceName})` : (source ?? 'manual');

    const result = await ingestDecision({
      bankId: workspace.hindsightBankId,
      workspaceId: workspace.id,
      rawText: text,
      extractedText: extractedText ?? undefined,
      source: finalSource,
      sourceUrl: sourceUrl ?? '',
      repoFullName: repoFullName ?? '',
      author: author ?? session.user.githubLogin,
      timestamp: new Date().toISOString(),
    })

    const formatted = {
      id: result.decision.id,
      title: result.decision.summary.length > 60 ? result.decision.summary.slice(0, 60) + '...' : result.decision.summary,
      decision: result.decision.summary,
      rationale: result.decision.rationale || "not stated",
      alternatives: [],
      caveats: result.decision.caveats ? result.decision.caveats.split(",").map((c: any) => c.trim()) : [],
      scope: result.decision.scope || "global",
      people: [result.decision.author],
      date: new Date(result.decision.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      state: result.decision.status as any,
      sourceType: result.decision.source.includes('github') ? 'github' : result.decision.source.includes('slack') ? 'slack' : result.decision.source.includes('discord') ? 'discord' : 'manual',
      source: result.decision.source,
      sourceUrl: result.decision.sourceUrl || undefined,
      tags: result.decision.scope ? [result.decision.scope] : [],
      reinforcementCount: 0,
      authorStatus: "active" as const,
      lifecycle: [
        {
          id: `evt_${result.decision.id}`,
          state: result.decision.status as any,
          date: new Date(result.decision.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          title: "Decision Recorded",
          summary: result.decision.summary,
          source: result.decision.source
        }
      ],
      content: result.decision.summary
    }

    return NextResponse.json({ success: true, decisionId: result.decision.id, record: formatted })
  } catch (err) {
    console.error('Failed to retain decision:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
