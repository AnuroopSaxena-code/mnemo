import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveBotOrSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const botSession = await resolveBotOrSession(req)
  if (!botSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'resolve-user') {
      const { discordUserId, discordUsername, guildId } = body
      if (!discordUserId || !discordUsername) {
        return NextResponse.json({ error: 'discordUserId and discordUsername are required' }, { status: 400 })
      }

      // 1. Resolve user by discordId
      let user = await db.user.findFirst({
        where: { discordId: discordUserId },
        include: { workspace: true }
      })

      // 2. Fallback to username search
      if (!user) {
        const normalizedUsername = discordUsername.replace(/^@/, '').trim().toLowerCase()
        const allUsers = await db.user.findMany({
          where: { NOT: { discordUsername: null } },
          include: { workspace: true }
        })
        
        user = allUsers.find(u => {
          const dbNormal = u.discordUsername?.replace(/^@/, '').trim().toLowerCase()
          return dbNormal === normalizedUsername
        }) || null

        if (user) {
          // Self-heal/bind real discord ID
          user = await db.user.update({
            where: { id: user.id },
            data: { discordId: discordUserId },
            include: { workspace: true }
          })
        }
      }

      if (!user) {
        return NextResponse.json({ user: null })
      }

      // 3. Check bot installation in guild
      if (guildId) {
        const inst = await db.botInstallation.findFirst({
          where: { platform: 'discord', platformId: guildId, workspaceId: user.workspaceId }
        })
        if (!inst) {
          return NextResponse.json({ user: null, error: 'Bot is not authorized in this server.' })
        }
      }

      return NextResponse.json({
        user: {
          id: user.id,
          githubLogin: user.githubLogin,
          discordId: user.discordId,
          discordUsername: user.discordUsername,
          activeRepo: user.activeRepo,
          workspaceId: user.workspaceId
        }
      })
    }

    if (action === 'get-repos') {
      const { discordUserId, discordUsername } = body
      if (!discordUserId || !discordUsername) {
        return NextResponse.json({ error: 'discordUserId and discordUsername are required' }, { status: 400 })
      }

      // Resolve user first
      let user = await db.user.findFirst({
        where: { discordId: discordUserId }
      })

      if (!user) {
        const normalizedUsername = discordUsername.replace(/^@/, '').trim().toLowerCase()
        const allUsers = await db.user.findMany({
          where: { NOT: { discordUsername: null } }
        })
        user = allUsers.find(u => {
          const dbNormal = u.discordUsername?.replace(/^@/, '').trim().toLowerCase()
          return dbNormal === normalizedUsername
        }) || null
      }

      if (!user) {
        return NextResponse.json({ repos: [] })
      }

      const repos = await db.repo.findMany({
        where: { workspaceId: user.workspaceId }
      })

      return NextResponse.json({
        repos: repos.map(r => ({ fullName: r.fullName }))
      })
    }

    if (action === 'set-repo') {
      const { discordUserId, repo } = body
      if (!discordUserId || !repo) {
        return NextResponse.json({ error: 'discordUserId and repo are required' }, { status: 400 })
      }

      const user = await db.user.findFirst({
        where: { discordId: discordUserId }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify repo exists in workspace
      if (repo !== 'LINK_ON_WEBSITE') {
        const repoExists = await db.repo.findFirst({
          where: { fullName: repo, workspaceId: user.workspaceId }
        })

        if (!repoExists) {
          return NextResponse.json({ error: 'Repository not linked to workspace' }, { status: 400 })
        }

        await db.user.update({
          where: { id: user.id },
          data: { activeRepo: repo }
        })
      }

      return NextResponse.json({ success: true, activeRepo: repo })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Bot API failure:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
