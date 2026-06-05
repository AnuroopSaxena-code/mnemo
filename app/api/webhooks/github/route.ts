import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { isDecision, ingestDecision } from '@/lib/ingest'
import { env } from '@/lib/env'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    
    // 1. Verify GitHub Signature
    const signature = req.headers.get('x-hub-signature-256')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    
    const hmac = crypto.createHmac('sha256', env.github.webhookSecret)
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex')
    
    // Secure compare
    const sigBuffer = Buffer.from(signature)
    const digestBuffer = Buffer.from(digest)
    
    if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventType = req.headers.get('x-github-event')
    
    const repoFullName = payload.repository?.full_name
    if (!repoFullName) {
      return NextResponse.json({ success: true })
    }

    // Determine potentially interesting text snippets based on event
    const candidates: { text: string; source: string; author: string; url: string; prTitle?: string }[] = []

    if (eventType === 'push') {
      const commits = payload.commits || []
      for (const commit of commits) {
        if (commit.message) {
          candidates.push({
            text: commit.message,
            source: 'github_commit',
            author: commit.author?.username || commit.author?.name || 'unknown',
            url: commit.url
          })
        }
      }
    } else if (eventType === 'pull_request') {
      const action = payload.action
      if ((action === 'opened' || action === 'edited' || action === 'closed') && payload.pull_request?.body) {
        candidates.push({
          text: payload.pull_request.body,
          source: 'github_pr',
          author: payload.pull_request.user?.login || 'unknown',
          url: payload.pull_request.html_url,
          prTitle: payload.pull_request.title
        })
      }
    } else if (eventType === 'issues') {
      const action = payload.action
      if ((action === 'opened' || action === 'edited' || action === 'closed') && payload.issue?.body) {
        candidates.push({
          text: payload.issue.body,
          source: 'github_issue',
          author: payload.issue.user?.login || 'unknown',
          url: payload.issue.html_url
        })
      }
    } else if (eventType === 'issue_comment') {
      const action = payload.action
      if ((action === 'created' || action === 'edited') && payload.comment?.body) {
        candidates.push({
          text: payload.comment.body,
          source: 'github_issue_comment',
          author: payload.comment.user?.login || 'unknown',
          url: payload.comment.html_url,
          prTitle: payload.issue?.title
        })
      }
    }

    // Filter out non-decisions quickly and concurrently process ingestion
    const decisions = candidates.filter(c => isDecision(c.text))
    
    if (decisions.length > 0) {
      // Find all workspaces that connected this repo
      const repos = await db.repo.findMany({
        where: { fullName: repoFullName },
        include: { workspace: true }
      })

      const ingestionPromises = []
      
      for (const repo of repos) {
        if (!repo.workspace?.hindsightBankId) continue
        
        for (const decision of decisions) {
          ingestionPromises.push(
            ingestDecision({
              bankId: repo.workspace.hindsightBankId,
              workspaceId: repo.workspaceId,
              rawText: decision.text,
              source: decision.source,
              sourceUrl: decision.url,
              repoFullName: repoFullName,
              author: decision.author,
              timestamp: new Date().toISOString(),
              prTitle: decision.prTitle
            }).catch(err => {
              console.error('Webhook ingestion error:', err)
            })
          )
        }
      }

      // Wait for all background ingestions to complete
      await Promise.allSettled(ingestionPromises)
    }

    return NextResponse.json({ success: true, processed: decisions.length })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
