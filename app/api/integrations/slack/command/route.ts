import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { resolveWorkspace } from '@/lib/workspace'
import { recall } from '@/lib/memory'
import { synthesiseAnswer } from '@/lib/groq'
import crypto from 'crypto'

function verifySlack(req: NextRequest, body: string): boolean {
  const ts = req.headers.get('x-slack-request-timestamp') ?? ''
  const sig = req.headers.get('x-slack-signature') ?? ''
  const base = `v0:${ts}:${body}`
  const expected = 'v0=' + crypto.createHmac('sha256', env.slack.signingSecret).update(base).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    if (!verifySlack(req, body)) return new NextResponse('Unauthorized', { status: 401 })

    const params = new URLSearchParams(body)
    const teamId = params.get('team_id') ?? ''
    const text = params.get('text') ?? ''
    const responseUrl = params.get('response_url') ?? ''

    const ws = await resolveWorkspace('slack', teamId)
    if (!ws) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `This Slack workspace isn't connected to Mnemo. Visit ${env.appUrl} to set up.`,
      })
    }

    // Acknowledge immediately (Slack needs <3s response)
    setTimeout(async () => {
      try {
        const memories = (await recall(ws.bankId, text, 5)) as any
        const answer = memories && memories.length > 0
          ? await synthesiseAnswer(text, memories)
          : "Nothing stored on that. Either it predates the integration or nobody wrote it down."

        await fetch(responseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response_type: 'in_channel', text: answer }),
        })
      } catch (e) {
        console.error('Slack deferred processing failed:', e)
      }
    }, 0)

    return NextResponse.json({ response_type: 'ephemeral', text: 'Looking that up...' })
  } catch (err) {
    console.error('Slack command handling error:', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
