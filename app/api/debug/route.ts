import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, any> = {
    envVars: {
      GITHUB_CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
      GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI || process.env.GITHUB_REDIRECT_URL || 'NOT SET',
      PRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      HINDSIGHT_API_KEY: !!process.env.HINDSIGHT_API_KEY,
    },
    resolvedEnv: {
      appUrl: env.appUrl,
      databaseUrl: env.databaseUrl?.slice(0, 40) + '...',
      redirectUri: env.github.redirectUri,
    },
    dbTest: null as any,
  }

  // Test DB connection
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1 as ping`
    checks.dbTest = { ok: true }
  } catch (err: any) {
    checks.dbTest = { ok: false, error: err?.message || String(err) }
  }

  return NextResponse.json(checks)
}
