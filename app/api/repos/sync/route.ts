import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { isDecision, ingestDecision } from '@/lib/ingest'
import { retain } from '@/lib/memory'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fullName } = await req.json()
    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const [owner, repo] = fullName.split('/')

    let ingested = 0
    
    // Fetch repository README for codebase context (crucial for blank repos)
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github.v3.raw',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (readmeRes.ok) {
        const readmeContent = await readmeRes.text()
        if (readmeContent && readmeContent.length > 50) {
          const truncatedReadme = readmeContent.slice(0, 5000);
          await retain(workspace.hindsightBankId, `Repository README for ${fullName}\n\n${truncatedReadme}`, {
            source: 'github_readme',
            sourceUrl: `https://github.com/${owner}/${repo}#readme`,
            repo: fullName,
            author: 'system',
            timestamp: new Date().toISOString(),
            context: 'core architecture and project description',
          })
          ingested++
        }
      }
    } catch (e) {
      console.warn("Could not fetch README", e)
    }

    // Fetch package.json for tech stack context
    try {
      const pkgRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github.v3.raw',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (pkgRes.ok) {
        const pkgContent = await pkgRes.text()
        if (pkgContent && pkgContent.length > 10) {
          await retain(workspace.hindsightBankId, `Repository package.json (Tech Stack Dependencies) for ${fullName}\n\n${pkgContent.slice(0, 5000)}`, {
            source: 'github_package_json',
            sourceUrl: `https://github.com/${owner}/${repo}/blob/main/package.json`,
            repo: fullName,
            author: 'system',
            timestamp: new Date().toISOString(),
            context: 'tech stack dependencies and scripts',
          })
          ingested++
        }
      }
    } catch (e) {
      console.warn("Could not fetch package.json", e)
    }

    // Fetch prisma schema if it exists for database context
    try {
      const schemaRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/prisma/schema.prisma`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github.v3.raw',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (schemaRes.ok) {
        const schemaContent = await schemaRes.text()
        if (schemaContent && schemaContent.length > 10) {
          await retain(workspace.hindsightBankId, `Repository Prisma Schema (Database Architecture) for ${fullName}\n\n${schemaContent.slice(0, 5000)}`, {
            source: 'github_prisma_schema',
            sourceUrl: `https://github.com/${owner}/${repo}/blob/main/prisma/schema.prisma`,
            repo: fullName,
            author: 'system',
            timestamp: new Date().toISOString(),
            context: 'database schema and models',
          })
          ingested++
        }
      }
    } catch (e) {
      console.warn("Could not fetch prisma schema", e)
    }

    // Fetch last 100 PR review comments
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/comments?per_page=100&sort=created&direction=desc`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (res.ok) {
        const comments = await res.json()
        if (Array.isArray(comments)) {
          for (const comment of comments) {
            if (!isDecision(comment.body)) continue
            await ingestDecision({
              bankId: workspace.hindsightBankId,
              workspaceId: workspace.id,
              rawText: comment.body,
              source: 'github_pr',
              sourceUrl: comment.html_url,
              repoFullName: fullName,
              author: comment.user?.login ?? 'unknown',
              timestamp: comment.created_at,
              prTitle: '',
            })
            ingested++
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch PR comments", e)
    }

    // Fetch last 100 commit messages
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (commitRes.ok) {
        const commits = await commitRes.json()
        if (Array.isArray(commits)) {
          for (const commitObj of commits) {
            const message = commitObj.commit?.message
            if (!message) continue
            // We only ingest commits that look like they contain decisions or significant context
            if (!isDecision(message)) continue
            
            await ingestDecision({
              bankId: workspace.hindsightBankId,
              workspaceId: workspace.id,
              rawText: message,
              source: 'github_commit',
              sourceUrl: commitObj.html_url,
              repoFullName: fullName,
              author: commitObj.commit?.author?.name ?? 'unknown',
              timestamp: commitObj.commit?.author?.date ?? new Date().toISOString(),
              prTitle: '',
            })
            ingested++
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch commits", e)
    }

    // Fetch last 100 GitHub Issues (both open and closed)
    try {
      const issuesRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&sort=updated&direction=desc`,
        {
          headers: {
            Authorization: `Bearer ${session.user.githubToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'mnemo-app',
          },
        }
      )
      
      if (issuesRes.ok) {
        const issues = await issuesRes.json()
        if (Array.isArray(issues)) {
          for (const issue of issues) {
            // GitHub API returns PRs as issues too, but they have a 'pull_request' key
            // We can ingest both, but since we already fetch PR comments, we focus on the issue body here.
            const body = issue.body
            if (!body) continue
            
            // Check if the issue description contains an architectural decision or technical context
            if (!isDecision(body)) continue
            
            await ingestDecision({
              bankId: workspace.hindsightBankId,
              workspaceId: workspace.id,
              rawText: `Issue #${issue.number}: ${issue.title}\n\n${body}`,
              source: 'github_issue',
              sourceUrl: issue.html_url,
              repoFullName: fullName,
              author: issue.user?.login ?? 'unknown',
              timestamp: issue.created_at,
              prTitle: issue.title, // Reusing prTitle for issue title
            })
            ingested++
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch issues", e)
    }

    return NextResponse.json({ ingested })
  } catch (err) {
    console.error('Failed to sync repo:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
