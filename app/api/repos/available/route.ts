import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch repos from GitHub
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${session.user.githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mnemo-app',
      },
    })
    
    const githubRepos = await res.json()
    
    if (!Array.isArray(githubRepos)) {
      console.error('Failed to fetch repos from GitHub:', githubRepos)
      return NextResponse.json({ repos: [] })
    }

    // Get already-connected repos
    const connected = await db.repo.findMany({
      where: { workspaceId: session.workspaceId },
      select: { githubRepoId: true },
    })
    const connectedIds = new Set(connected.map(r => r.githubRepoId))

    return NextResponse.json({
      repos: githubRepos.map((r: Record<string, any>) => ({
        id: String(r.id),
        fullName: r.full_name,
        private: r.private,
        description: r.description,
        language: r.language,
        updatedAt: r.updated_at,
        connected: connectedIds.has(String(r.id)),
      }))
    })
  } catch (err) {
    console.error('Error fetching available repos:', err)
    return NextResponse.json({ error: 'Failed to retrieve repositories' }, { status: 500 })
  }
}
