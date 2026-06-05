import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { isDecision, ingestDecision } from '@/lib/ingest'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fullName } = await req.json()
    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const [owner, repo] = fullName.split('/')

    // Fetch last 100 PR review comments
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/comments?per_page=100&sort=created&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${session.user.githubToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'mnemo-app',
        },
      }
    )
    const comments = await res.json()
    if (!Array.isArray(comments)) {
      console.warn('Comments fetch did not return an array:', comments)
      return NextResponse.json({ ingested: 0 })
    }

    let ingested = 0
    for (const comment of comments) {
      if (!isDecision(comment.body)) continue
      await ingestDecision({
        bankId: workspace.hindsightBankId,
        workspaceId: workspace.id,
        rawText: comment.body,
        source: 'github_pr',
        sourceUrl: comment.html_url,
        repoFullName: fullName,
        author: comment.user?.login ?? 'unknown',
        timestamp: comment.created_at,
        prTitle: '',
      })
      ingested++
    }

    return NextResponse.json({ ingested })
  } catch (err) {
    console.error('Failed to sync comments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
