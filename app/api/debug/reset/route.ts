import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    await db.decision.deleteMany({})
    return NextResponse.json({ success: true, message: "All decisions deleted" })
  } catch (err) {
    console.error("Failed to reset DB:", err)
    return NextResponse.json({ error: "Failed to reset DB" }, { status: 500 })
  }
}
