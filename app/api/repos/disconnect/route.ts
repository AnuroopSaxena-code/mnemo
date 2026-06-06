import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { repoId } = await req.json()

    await db.repo.deleteMany({
      where: {
        workspaceId: session.workspaceId,
        githubRepoId: String(repoId),
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to disconnect repository:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
