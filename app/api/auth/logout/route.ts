import { NextResponse } from 'next/server'
import { clearSessionCookie, getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const session = await getSession()
    if (session) {
      const cookieStore = await cookies()
      const token = cookieStore.get('mnemo_session')?.value
      if (token) await db.session.deleteMany({ where: { token } })
    }
  } catch (err) {
    console.error('Logout failed to clean session:', err)
  }
  const res = NextResponse.redirect(new URL('/', env.appUrl))
  res.cookies.set('mnemo_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
