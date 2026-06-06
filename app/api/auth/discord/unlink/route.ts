import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: {
        discordId: null,
        discordUsername: null
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        login: updatedUser.githubLogin,
        discordId: null,
        discordUsername: null
      }
    })
  } catch (err: any) {
    console.error('Failed to unlink Discord account:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
