import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { env } from '@/lib/env'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!env.slack.clientId) return NextResponse.json({ error: 'Slack not configured' }, { status: 400 })

  const params = new URLSearchParams({
    client_id: env.slack.clientId,
    redirect_uri: env.slack.redirectUri,
    scope: 'commands,chat:write,team:read',
    user_scope: '',
  })
  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params}`)
}
