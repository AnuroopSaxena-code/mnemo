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
  if (!code) return NextResponse.redirect(new URL('/?error=slack_failed', env.appUrl))

  try {
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.slack.clientId,
        client_secret: env.slack.clientSecret,
        code,
        redirect_uri: env.slack.redirectUri,
      }),
    })
    const data = await tokenRes.json()
    if (!data.ok) {
      console.error('Slack OAuth token exchange failed:', data)
      return NextResponse.redirect(new URL('/?error=slack_failed', env.appUrl))
    }

    await db.botInstallation.upsert({
      where: { platform_platformId: { platform: 'slack', platformId: String(data.team.id) } },
      create: {
        id: `bot_${nanoid(12)}`,
        workspaceId: session.workspaceId,
        platform: 'slack',
        platformId: String(data.team.id),
        platformToken: data.access_token,
      },
      update: { workspaceId: session.workspaceId, platformToken: data.access_token },
    })

    return NextResponse.redirect(new URL('/?connected=slack', env.appUrl))
  } catch (err: any) {
    console.error('Slack callback failed:', err)
    const msg = err?.message || String(err)
    return NextResponse.redirect(new URL(`/?error=slack_callback_error&message=${encodeURIComponent(msg)}`, env.appUrl))
  }
}
