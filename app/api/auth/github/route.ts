import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import crypto from 'crypto'

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex')
  // In production store state in a short-lived cookie to prevent CSRF
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.redirectUri,
    scope: 'read:user user:email repo',
    state,
  })
  return redirect(`https://github.com/login/oauth/authorize?${params}`)
}
