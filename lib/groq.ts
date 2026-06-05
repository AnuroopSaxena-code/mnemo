import Groq from 'groq-sdk'
import { env } from './env'

export const groq = new Groq({ apiKey: env.groq.apiKey })
export const MODEL = 'llama-3.3-70b-versatile'

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
You are Mnemo. Write a pre-mortem for the proposed change. 
If relevant codebase memories are provided, use them to highlight specific risks based on the team's history. 
If NO relevant history is provided, analyze the proposal using general software engineering principles and potential failure modes.
Max 3 risks. Each risk: one paragraph. 
If you are using general knowledge because no history was provided, start the response with the exact phrase "headline: AI Generated Generic Pre-Mortem" and make sure the summary mentions that no relevant history was found.
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

export async function synthesiseAnswer(query: string, memories: any[]): Promise<string> {
  // Truncate memories to prevent Groq 12,000 TPM rate limit errors on the free tier
  const safeMemories = memories.map(m => ({
    id: m.id,
    content: typeof m.content === 'string' ? m.content.slice(0, 1500) + (m.content.length > 1500 ? '...' : '') : m.content
  }))

  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 400,
    messages: [
      { role: 'system', content: ANSWER_PROMPT },
      { role: 'user', content: `Question: ${query}\n\nMemories: ${JSON.stringify(safeMemories)}` }
    ]
  })
  return res.choices[0].message.content ?? 'No answer generated.'
}

export async function generatePremortem(proposal: string, memories: any[]): Promise<string> {
  const safeMemories = memories.map(m => ({
    id: m.id,
    content: typeof m.content === 'string' ? m.content.slice(0, 1500) + (m.content.length > 1500 ? '...' : '') : m.content
  }))

  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 500,
    messages: [
      { role: 'system', content: PREMORTEM_PROMPT },
      { role: 'user', content: `Proposal: ${proposal}\n\nTeam history and Codebase Context: ${JSON.stringify(safeMemories)}` }
    ]
  })
  return res.choices[0].message.content ?? 'No pre-mortem generated.'
}

export interface ParsedDecision {
  decision: string;
  rationale: string;
  alternatives: { name: string; rejectedBecause: string }[];
  caveats: string[];
  scope: string;
}

export function parseExtraction(rawText: string): ParsedDecision {
  const lines = rawText.split('\n');
  const result: ParsedDecision = {
    decision: '',
    rationale: '',
    alternatives: [],
    caveats: [],
    scope: 'global'
  };

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.match(/^(1\.\s*)?DECISION:/i)) {
      currentSection = 'DECISION';
      result.decision = trimmed.replace(/^(1\.\s*)?DECISION:\s*/i, '');
    } else if (trimmed.match(/^(2\.\s*)?RATIONALE:/i)) {
      currentSection = 'RATIONALE';
      const ratStr = trimmed.replace(/^(2\.\s*)?RATIONALE:\s*/i, '');
      result.rationale = ratStr.toLowerCase() === 'not stated' || ratStr.toLowerCase() === 'not stated.' ? '' : ratStr;
    } else if (trimmed.match(/^(3\.\s*)?ALTERNATIVES REJECTED:/i)) {
      currentSection = 'ALTERNATIVES';
      const altStr = trimmed.replace(/^(3\.\s*)?ALTERNATIVES REJECTED:\s*/i, '');
      if (altStr && altStr.toLowerCase() !== 'none' && altStr.toLowerCase() !== 'not stated') {
        const parts = altStr.split('—');
        if (parts.length >= 2) {
          result.alternatives.push({ name: parts[0].trim(), rejectedBecause: parts.slice(1).join('—').trim() });
        }
      }
    } else if (trimmed.match(/^(4\.\s*)?CAVEATS:/i)) {
      currentSection = 'CAVEATS';
      const cavStr = trimmed.replace(/^(4\.\s*)?CAVEATS:\s*/i, '');
      if (cavStr && cavStr.toLowerCase() !== 'none' && cavStr.toLowerCase() !== 'not stated' && cavStr.toLowerCase() !== 'not stated.') {
        result.caveats.push(cavStr);
      }
    } else if (trimmed.match(/^(5\.\s*)?SCOPE:/i)) {
      currentSection = 'SCOPE';
      const scopeStr = trimmed.replace(/^(5\.\s*)?SCOPE:\s*/i, '');
      result.scope = scopeStr.toLowerCase() === 'not stated' || scopeStr.toLowerCase() === 'not stated.' ? 'global' : scopeStr;
    } else {
      if (currentSection === 'DECISION') result.decision += ' ' + trimmed;
      if (currentSection === 'RATIONALE') result.rationale += ' ' + trimmed;
      if (currentSection === 'ALTERNATIVES') {
        const parts = trimmed.split('—');
        if (parts.length >= 2) {
          result.alternatives.push({ name: parts[0].trim(), rejectedBecause: parts.slice(1).join('—').trim() });
        }
      }
      if (currentSection === 'CAVEATS') result.caveats.push(trimmed);
      if (currentSection === 'SCOPE') result.scope += ' ' + trimmed;
    }
  }

  if (!result.decision && rawText) {
    result.decision = rawText.split('\n')[0];
  }

  return result;
}

