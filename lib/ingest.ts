import { db } from './db'
import { retain, recall } from './memory'
import { extractDecision, parseExtraction } from './groq'
import { nanoid } from 'nanoid'

const DECISION_SIGNALS = [
  'we decided', 'going with', 'rejected', 'instead of', "won't use",
  'tradeoff', 'because of', 'switched to', 'the reason we', 'chose not to',
  'after discussing', 'we went with', 'not using', 'the problem with',
  'moving to', 'moving away from', 'moving back to'
]

export function isDecision(text: string): boolean {
  const lower = text.toLowerCase()
  return DECISION_SIGNALS.some(s => lower.includes(s))
}

export async function ingestDecision({
  bankId,
  workspaceId,
  rawText,
  extractedText,
  source,
  sourceUrl,
  repoFullName,
  author,
  timestamp,
  prTitle,
}: {
  bankId: string
  workspaceId: string
  rawText: string
  extractedText?: string
  source: string
  sourceUrl: string
  repoFullName: string
  author: string
  timestamp: string
  prTitle?: string
}) {
  // 1. Extract structured decision
  const context = `${source} in ${repoFullName}${prTitle ? ` — PR: ${prTitle}` : ''}`
  const extracted = extractedText || await extractDecision(rawText, context)
  const parsed = parseExtraction(extracted)

  // 2. Check for déjà vu
  const similar = await recall(bankId, rawText, 3)
  const hasConflict = similar.length > 0

  // 3. Build content for Hindsight
  const content = `Engineering decision in ${repoFullName}
Author: @${author}
${prTitle ? `PR: ${prTitle}\n` : ''}
${extracted}`

  // 4. Retain to Hindsight
  const hindsightResult = await retain(bankId, content, {
    source,
    sourceUrl,
    repo: repoFullName,
    author,
    timestamp,
    context: `engineering decision — ${source}`,
  })

  // 5. Store locally
  const decision = await db.decision.create({
    data: {
      id: nanoid(),
      workspaceId,
      hindsightId: (hindsightResult as { id?: string })?.id ?? '',
      summary: parsed.decision.slice(0, 200),
      rationale: parsed.rationale,
      alternatives: JSON.stringify(parsed.alternatives),
      caveats: parsed.caveats.join(','),
      scope: parsed.scope,
      source,
      sourceUrl,
      repoFullName,
      author,
      status: 'standing',
    }
  })

  return { decision, hasConflict, similar }
}
