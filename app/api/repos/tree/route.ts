import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fullName = req.nextUrl.searchParams.get('fullName')
  if (!fullName) return NextResponse.json({ error: 'Missing fullName' }, { status: 400 })

  const [owner, repo] = fullName.split('/')

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        Authorization: `Bearer ${session.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'mnemo-app',
      }
    })

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.statusText}`)
    }

    const data = await res.json()
    const dirs = data.filter((d: any) => d.type === 'dir').map((d: any) => d.name)

    return NextResponse.json({ dirs })
  } catch (err) {
    console.error('Failed to fetch repo tree:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
