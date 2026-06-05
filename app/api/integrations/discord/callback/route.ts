import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { nanoid } from 'nanoid'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL('/', env.appUrl))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/dashboard?error=discord_failed', env.appUrl))

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.discord.clientId,
        client_secret: env.discord.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.discord.redirectUri,
      }),
    })
    
    const tokenData = await tokenRes.json()
    const guildId = tokenData.guild?.id

    if (!guildId) {
      console.error('Discord OAuth did not return guild ID:', tokenData)
      return NextResponse.redirect(new URL('/dashboard?error=discord_no_guild', env.appUrl))
    }

    await db.botInstallation.upsert({
      where: { platform_platformId: { platform: 'discord', platformId: String(guildId) } },
      create: {
        id: `bot_${nanoid(12)}`,
        workspaceId: session.workspaceId,
        platform: 'discord',
        platformId: String(guildId),
      },
      update: { workspaceId: session.workspaceId },
    })

    return NextResponse.redirect(new URL('/dashboard?connected=discord', env.appUrl))
  } catch (err) {
    console.error('Discord callback failed:', err)
    return NextResponse.redirect(new URL('/dashboard?error=discord_callback_error', env.appUrl))
  }
}
