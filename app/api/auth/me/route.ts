import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  try {
    const [repos, decisions, integrations] = await Promise.all([
      db.repo.findMany({ where: { workspaceId: session.workspaceId } }),
      db.decision.count({ where: { workspaceId: session.workspaceId } }),
      db.botInstallation.findMany({ where: { workspaceId: session.workspaceId } }),
    ])

    return NextResponse.json({
      user: {
        id: session.user.id,
        login: session.user.githubLogin,
        avatarUrl: session.user.avatarUrl,
        role: session.user.role,
      },
      workspace: { id: session.workspaceId },
      repos,
      decisions,
      integrations: integrations.map((i: any) => ({ platform: i.platform, connectedAt: i.installedAt })),
    })
  } catch (err) {
    console.error('Failed to retrieve current user info:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
