import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Delete in dependency order
    await db.decision.deleteMany({})
    await db.session.deleteMany({})
    await db.botInstallation.deleteMany({})
    await db.repo.deleteMany({})
    await db.user.deleteMany({})
    await db.workspace.deleteMany({})

    return NextResponse.json({
      success: true,
      message: "All data wiped. Log in again to start fresh."
    })
  } catch (err) {
    console.error("Failed to reset DB:", err)
    return NextResponse.json({ error: "Failed to reset DB", details: String(err) }, { status: 500 })
  }
}
