import Groq from 'groq-sdk'
import { env } from './env'

export const groq = new Groq({ apiKey: env.groq.apiKey })
export const MODEL = 'qwen-qwen3-32b'

export const EXTRACTION_PROMPT = `
You are an engineering knowledge extractor. Extract from the raw text:

1. DECISION: What was decided? One sentence. "We chose X over Y."
2. RATIONALE: The concrete reason. Not a restatement. If absent: "not stated."
3. ALTERNATIVES REJECTED: Each ruled-out option and why. Format: "Option — reason."
4. CAVEATS: "Revisit if X" or expiry conditions. Omit if none.
5. SCOPE: Affected system component. E.g. "auth service", "database schema."

Rules: be specific, never hallucinate, omit absent fields, max 150 words,
plain prose, no JSON, no headers.
`

export const ANSWER_PROMPT = `
You are Mnemo. Answer using only the recalled memories. No general knowledge.
Lead with the fact, then context, then caveats.
Sound like a senior engineer who was there. Max 150 words.
If memories don't answer the question: "Nothing stored on that."
`

export const PREMORTEM_PROMPT = `
You are Mnemo. Write a pre-mortem for the proposed change using only recalled
memories from this team's history. Max 3 risks. Each risk: one paragraph
starting with the specific past experience, then the implication for the
current proposal. No generic best practices. If no relevant history:
"No relevant history found for this change. Storing for future reference."
`

export async function extractDecision(rawText: string, context: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 300,
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: `Context: ${context}\n\nText: ${rawText}` }
    ]
  })
  return res.choices[0].message.content ?? rawText
}

export async function synthesiseAnswer(query: string, memories: unknown[]): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 400,
    messages: [
      { role: 'system', content: ANSWER_PROMPT },
      { role: 'user', content: `Question: ${query}\n\nMemories: ${JSON.stringify(memories)}` }
    ]
  })
  return res.choices[0].message.content ?? 'No answer generated.'
}

export async function generatePremortem(proposal: string, memories: unknown[]): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 500,
    messages: [
      { role: 'system', content: PREMORTEM_PROMPT },
      { role: 'user', content: `Proposal: ${proposal}\n\nTeam history: ${JSON.stringify(memories)}` }
    ]
  })
  return res.choices[0].message.content ?? 'No pre-mortem generated.'
}
