import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  try {
    let [dbUser, repos, decisions, integrations] = await Promise.all([
      db.user.findUnique({ where: { id: session.userId } }),
      db.repo.findMany({ where: { workspaceId: session.workspaceId } }),
      db.decision.count({ where: { workspaceId: session.workspaceId } }),
      db.botInstallation.findMany({ where: { workspaceId: session.workspaceId } }),
    ])

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        login: dbUser.githubLogin,
        avatarUrl: dbUser.avatarUrl,
        role: dbUser.role,
        discordId: dbUser.discordId,
        discordUsername: dbUser.discordUsername,
      },
      workspace: { id: session.workspaceId },
      repos,
      decisions,
      integrations: integrations.map((i: any) => ({
        id: i.id,
        platform: i.platform,
        platformId: i.platformId,
        guildName: i.platformToken,
        connectedAt: i.installedAt
      })),
    })
  } catch (err) {
    console.error('Failed to retrieve current user info:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
