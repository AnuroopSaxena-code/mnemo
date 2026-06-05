import { db } from './db'
import { retain } from './memory'
import { seedDecisions } from './seed-decisions'

export async function seedWorkspace(workspaceId: string, bankId: string, repoName: string) {
  try {
    // Check if already seeded
    const count = await db.decision.count({ where: { workspaceId } })
    if (count > 0) {
      console.log(`Workspace ${workspaceId} is already seeded.`)
      return
    }

    console.log(`Seeding workspace ${workspaceId} with seed decisions...`)
    for (const dec of seedDecisions) {
      // 1. Retain to Hindsight
      let hindsightId = ''
      try {
        const metadata = {
          source: dec.sourceType,
          sourceUrl: dec.sourceUrl || '',
          repo: repoName,
          author: dec.people[0] || 'unknown',
          timestamp: new Date().toISOString(),
          context: `engineering decision — ${dec.sourceType}`,
        }
        const hindsightResult = await retain(bankId, dec.content, metadata)
        hindsightId = (hindsightResult as { id?: string })?.id ?? ''
      } catch (e) {
        console.warn('Failed to retain seed decision in Hindsight:', e)
      }

      // 2. Create in DB
      await db.decision.create({
        data: {
          id: dec.id,
          workspaceId,
          hindsightId,
          summary: dec.decision,
          rationale: dec.rationale,
          alternatives: JSON.stringify(dec.alternatives),
          caveats: dec.caveats.join(','),
          scope: dec.scope,
          author: dec.people[0] || 'unknown',
          source: dec.sourceType,
          sourceUrl: dec.sourceUrl || '',
          repoFullName: repoName,
          status: dec.state,
        }
      })
    }
    console.log(`Workspace ${workspaceId} seeding complete.`)
  } catch (error) {
    console.error('Workspace seeding failed:', error)
  }
}
