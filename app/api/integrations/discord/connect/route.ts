import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { env } from '@/lib/env'
import crypto from 'crypto'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!env.discord.clientId) return NextResponse.json({ error: 'Discord not configured' }, { status: 400 })

  const state = crypto.randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    client_id: env.discord.clientId,
    redirect_uri: env.discord.redirectUri,
    response_type: 'code',
    scope: 'bot applications.commands',
    permissions: '2048',
    state,
  })
  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
}
