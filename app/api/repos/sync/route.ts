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

    let ingested = 0
    
    // Fetch last 100 PR review comments
    try {
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
      
      if (res.ok) {
        const comments = await res.json()
        if (Array.isArray(comments)) {
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
        }
      }
    } catch (e) {
      console.warn("Could not fetch PR comments", e)
    }

    // Fetch last 100 commit messages
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (commitRes.ok) {
        const commits = await commitRes.json()
        if (Array.isArray(commits)) {
          for (const commitObj of commits) {
            const message = commitObj.commit?.message
            if (!message) continue
            // We only ingest commits that look like they contain decisions or significant context
            if (!isDecision(message)) continue
            
            await ingestDecision({
              bankId: workspace.hindsightBankId,
              workspaceId: workspace.id,
              rawText: message,
              source: 'github_commit',
              sourceUrl: commitObj.html_url,
              repoFullName: fullName,
              author: commitObj.commit?.author?.name ?? 'unknown',
              timestamp: commitObj.commit?.author?.date ?? new Date().toISOString(),
              prTitle: '',
            })
            ingested++
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch commits", e)
    }

    return NextResponse.json({ ingested })
  } catch (err) {
    console.error('Failed to sync repo:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
