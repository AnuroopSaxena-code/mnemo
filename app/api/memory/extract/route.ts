import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { extractDecision, parseExtraction } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text, source, sourceName } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })

    const context = `${source ?? 'manual'} in ${sourceName ?? 'unknown'}`
    const extractedText = await extractDecision(text, context)
    const parsed = parseExtraction(extractedText)

    return NextResponse.json({
      extractedText,
      parsed
    })
  } catch (err) {
    console.error('Failed to extract decision:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
