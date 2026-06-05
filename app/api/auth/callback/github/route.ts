import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/session'
import { env } from '@/lib/env'
import { nanoid } from 'nanoid'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/?error=no_code', env.appUrl))

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.github.clientId,
        client_secret: env.github.clientSecret,
        code,
        redirect_uri: env.github.redirectUri,
      }),
    })
    const tokenData = await tokenRes.json()
    const access_token = tokenData.access_token
    const error = tokenData.error
    
    if (error || !access_token) {
      console.error('GitHub token exchange error:', error)
      return NextResponse.redirect(new URL('/?error=oauth_failed', env.appUrl))
    }

    // Get GitHub user
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${access_token}`, 
        Accept: 'application/json',
        'User-Agent': 'mnemo-app'
      },
    })
    const githubUser = await userRes.json()

    if (!githubUser.id) {
      console.error('GitHub profile retrieval failed:', githubUser)
      return NextResponse.redirect(new URL('/?error=profile_failed', env.appUrl))
    }

    // Find or create user + workspace
    let user = await db.user.findUnique({ where: { githubId: String(githubUser.id) } })
    let isNew = false

    if (!user) {
      isNew = true
      const workspaceId = `ws_${nanoid(12)}`
      const bankId = `bank_${workspaceId}`

      const workspace = await db.workspace.create({
        data: {
          id: workspaceId,
          name: `${githubUser.login}'s workspace`,
          hindsightBankId: bankId,
        },
      })

      user = await db.user.create({
        data: {
          id: `usr_${nanoid(12)}`,
          workspaceId: workspace.id,
          githubId: String(githubUser.id),
          githubLogin: githubUser.login,
          githubToken: access_token,
          avatarUrl: githubUser.avatar_url ?? '',
          role: 'owner',
        },
      })
    } else {
      // Refresh token
      await db.user.update({
        where: { id: user.id },
        data: { githubToken: access_token, avatarUrl: githubUser.avatar_url ?? '' },
      })
    }

    const sessionToken = await createSession(user.id, user.workspaceId)
    const dest = isNew ? '/onboarding' : '/dashboard'

    const res = NextResponse.redirect(new URL(dest, env.appUrl))
    res.headers.set('Set-Cookie', setSessionCookie(sessionToken))
    return res
  } catch (err) {
    console.error('GitHub callback execution failed:', err)
    return NextResponse.redirect(new URL('/?error=callback_error', env.appUrl))
  }
}
