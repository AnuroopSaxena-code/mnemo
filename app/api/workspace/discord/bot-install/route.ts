import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { guildId, guildName } = await req.json()
    if (!guildId || !guildName) {
      return NextResponse.json({ error: 'Guild ID and Guild Name are required' }, { status: 400 })
    }

    // Upsert bot installation
    const inst = await db.botInstallation.upsert({
      where: {
        platform_platformId: {
          platform: 'discord',
          platformId: guildId
        }
      },
      update: {
        workspaceId: session.workspaceId,
        platformToken: guildName // Store the guild name here for display
      },
      create: {
        workspaceId: session.workspaceId,
        platform: 'discord',
        platformId: guildId,
        platformToken: guildName
      }
    })

    return NextResponse.json({
      success: true,
      installation: {
        id: inst.id,
        platform: inst.platform,
        platformId: inst.platformId,
        guildName: inst.platformToken,
        installedAt: inst.installedAt
      }
    })
  } catch (err: any) {
    console.error('Failed to install bot to Discord guild:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
