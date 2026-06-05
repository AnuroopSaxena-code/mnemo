import { HindsightClient } from '@vectorize-io/hindsight-client'
import { env } from './env'

const client = new HindsightClient({
  apiKey: env.hindsight.apiKey,
  baseUrl: env.hindsight.baseUrl,
})

export async function recall(bankId: string, query: string, topK = 5) {
  if (!bankId) throw new Error('bankId required — never query global memory')
  try {
    const res = await client.recall(bankId, query)
    return (res.results || []).map((m: any) => ({
      ...m,
      content: m.text || m.content || '',
    }))
  } catch (e) {
    console.error('Hindsight recall error:', e)
    return []
  }
}

export async function retain(bankId: string, content: string, metadata: Record<string, unknown>) {
  if (!bankId) throw new Error('bankId required — never retain to global memory')
  try {
    const stringMetadata: Record<string, string> = {}
    for (const [k, v] of Object.entries(metadata)) {
      stringMetadata[k] = typeof v === 'string' ? v : String(v)
    }
    return await client.retain(bankId, content, { metadata: stringMetadata })
  } catch (e) {
    console.error('Hindsight retain error:', e)
    throw e
  }
}
