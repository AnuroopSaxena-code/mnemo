import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { discordId, discordUsername } = await req.json()
    if (!discordId || !discordUsername) {
      return NextResponse.json({ error: 'Discord ID and Username are required' }, { status: 400 })
    }

    // Check if another user has this discordId linked
    const existing = await db.user.findFirst({
      where: {
        discordId,
        NOT: { id: session.userId }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'This Discord account is already linked to another Mnemo user' }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: {
        discordId,
        discordUsername
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        login: updatedUser.githubLogin,
        discordId: updatedUser.discordId,
        discordUsername: updatedUser.discordUsername
      }
    })
  } catch (err: any) {
    console.error('Failed to link Discord account:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
