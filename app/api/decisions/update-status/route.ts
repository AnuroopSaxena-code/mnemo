import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { sendDiscordAlert } from '@/lib/discord'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status, reversalReason } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 })
    }

    const decision = await db.decision.findFirst({
      where: { id, workspaceId: session.workspaceId }
    })

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    const updated = await db.decision.update({
      where: { id },
      data: {
        status,
        reversalReason: reversalReason || "",
        reversedAt: status === 'reversed' ? new Date() : null
      }
    })

    // Trigger automated Discord alert
    if (status === 'reversed') {
      await sendDiscordAlert(session.workspaceId, {
        title: `🚨 Decision Reversed: ${updated.summary.slice(0, 80)}${updated.summary.length > 80 ? '...' : ''}`,
        description: `**Reversal Reason:** ${reversalReason || 'Not specified'}\n\nThis decision is no longer valid. Check Mnemo for details.`,
        color: 0xEF4444, // Red
        fields: [
          { name: 'Repository', value: updated.repoFullName || 'N/A', inline: true },
          { name: 'Author', value: `@${updated.author}`, inline: true },
          { name: 'Original Scope', value: updated.scope || 'global', inline: true }
        ]
      })
    } else if (status === 'stale') {
      await sendDiscordAlert(session.workspaceId, {
        title: `⚠️ Decision Marked Stale: ${updated.summary.slice(0, 80)}${updated.summary.length > 80 ? '...' : ''}`,
        description: `This decision has been flagged as stale or expired and needs architectural review.`,
        color: 0xF59E0B, // Orange/Yellow
        fields: [
          { name: 'Repository', value: updated.repoFullName || 'N/A', inline: true },
          { name: 'Author', value: `@${updated.author}`, inline: true },
          { name: 'Scope', value: updated.scope || 'global', inline: true }
        ]
      })
    } else if (status === 'standing' || status === 'decided') {
      await sendDiscordAlert(session.workspaceId, {
        title: `✅ Decision Reinstated: ${updated.summary.slice(0, 80)}${updated.summary.length > 80 ? '...' : ''}`,
        description: `This decision has been returned to active standing.`,
        color: 0x10B981, // Green
        fields: [
          { name: 'Repository', value: updated.repoFullName || 'N/A', inline: true },
          { name: 'Author', value: `@${updated.author}`, inline: true }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      decision: {
        id: updated.id,
        status: updated.status,
        reversalReason: updated.reversalReason,
        reversedAt: updated.reversedAt
      }
    })
  } catch (err: any) {
    console.error('Failed to update decision status:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
