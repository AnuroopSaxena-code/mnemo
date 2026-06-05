import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { resolveWorkspace } from '@/lib/workspace'
import { isDecision, ingestDecision } from '@/lib/ingest'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import crypto from 'crypto'

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const sig = req.headers.get('x-hub-signature-256') ?? ''
  const expected = 'sha256=' + crypto
    .createHmac('sha256', env.github.webhookSecret)
    .update(body).digest('hex')
  if (sig.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    if (!await verifySignature(req, body)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const event = req.headers.get('x-github-event')
    const payload = JSON.parse(body)

    // Handle app installation
    if (event === 'installation' && payload.action === 'created') {
      const installerId = String(payload.sender?.id)
      const user = await db.user.findUnique({ where: { githubId: installerId } })
      if (user) {
        await db.botInstallation.upsert({
          where: {
            platform_platformId: { platform: 'github', platformId: String(payload.installation.id) }
          },
          create: {
            id: `bot_${nanoid(12)}`,
            workspaceId: user.workspaceId,
            platform: 'github',
            platformId: String(payload.installation.id),
          },
          update: { workspaceId: user.workspaceId },
        })

        // Register repos
        const repos = payload.repositories ?? []
        for (const r of repos) {
          await db.repo.upsert({
            where: {
              workspaceId_githubRepoId: {
                workspaceId: user.workspaceId,
                githubRepoId: String(r.id),
              }
            },
            create: {
              id: `repo_${nanoid(12)}`,
              workspaceId: user.workspaceId,
              githubRepoId: String(r.id),
              fullName: r.full_name,
              installationId: String(payload.installation.id),
            },
            update: { installationId: String(payload.installation.id) },
          })
        }
      }
    }

    // Handle PR comments and review comments
    if (event === 'pull_request_review_comment' || event === 'issue_comment') {
      const installationId = String(payload.installation?.id)
      const workspace = await resolveWorkspace('github', installationId)
      if (!workspace) return new NextResponse('Not configured', { status: 200 })

      const comment = payload.comment?.body ?? ''
      if (!comment || !isDecision(comment)) return new NextResponse('Skipped', { status: 200 })

      const pr = payload.pull_request ?? payload.issue
      await ingestDecision({
        bankId: workspace.bankId,
        workspaceId: workspace.workspaceId,
        rawText: comment,
        source: 'github_pr',
        sourceUrl: payload.comment?.html_url ?? '',
        repoFullName: payload.repository?.full_name ?? '',
        author: payload.comment?.user?.login ?? 'unknown',
        timestamp: payload.comment?.created_at ?? new Date().toISOString(),
        prTitle: pr?.title ?? '',
      })
    }

    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook execution failed:', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
