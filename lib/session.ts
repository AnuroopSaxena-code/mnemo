import { db } from './db'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'mnemo_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function createSession(userId: string, workspaceId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.session.create({ data: { userId, workspaceId, token, expiresAt } })
  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token }
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      try {
        await db.session.delete({ where: { token } })
      } catch (e) {
        console.error('Session deletion failed:', e)
      }
    }
    return null
  }

  const user = await db.user.findUnique({ where: { id: session.userId } })
  if (!user) return null

  return { userId: session.userId, workspaceId: session.workspaceId, user }
}

export function setSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}
