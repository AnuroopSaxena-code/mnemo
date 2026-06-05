import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.decision.deleteMany({})
    await db.repo.deleteMany({})
    await db.botInstallation.deleteMany({})
    await db.session.deleteMany({})
    await db.user.deleteMany({})
    await db.workspace.deleteMany({})

    return NextResponse.json({ message: 'Database reset successfully. You can now log in again to start completely fresh!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
