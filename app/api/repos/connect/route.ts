import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { repoId, fullName, isPrivate } = await req.json()

    await db.repo.upsert({
      where: {
        workspaceId_githubRepoId: {
          workspaceId: session.workspaceId,
          githubRepoId: String(repoId),
        }
      },
      create: {
        id: `repo_${nanoid(12)}`,
        workspaceId: session.workspaceId,
        githubRepoId: String(repoId),
        fullName,
        private: isPrivate ?? false,
      },
      update: { fullName },
    })

    // Setup Webhook automatically
    const webhookUrl = `${env.appUrl}/api/webhooks/github`
    
    // 1. Check existing hooks
    const hooksRes = await fetch(`https://api.github.com/repos/${fullName}/hooks`, {
      headers: {
        Authorization: `Bearer ${session.user.githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mnemo-app'
      }
    })
    
    if (hooksRes.ok) {
      const hooks = await hooksRes.json()
      const alreadyExists = Array.isArray(hooks) && hooks.some((hook: any) => hook.config?.url === webhookUrl)
      
      if (!alreadyExists) {
        // 2. Create the hook
        const createRes = await fetch(`https://api.github.com/repos/${fullName}/hooks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'mnemo-app'
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push', 'pull_request', 'issues', 'issue_comment'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: env.github.webhookSecret,
              insecure_ssl: '0'
            }
          })
        })
        if (!createRes.ok) {
          console.error('Failed to create webhook:', await createRes.text())
        }
      }
    } else {
      console.error('Failed to fetch hooks:', await hooksRes.text())
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to connect repository:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
