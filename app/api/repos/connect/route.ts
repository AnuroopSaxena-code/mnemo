import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { repoId, fullName, isPrivate } = await req.json()

    await db.repo.upsert({
      where: {
        workspaceId_githubRepoId: {
          workspaceId: session.workspaceId,
          githubRepoId: String(repoId),
        }
      },
      create: {
        id: `repo_${nanoid(12)}`,
        workspaceId: session.workspaceId,
        githubRepoId: String(repoId),
        fullName,
        private: isPrivate ?? false,
      },
      update: { fullName },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to connect repository:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
