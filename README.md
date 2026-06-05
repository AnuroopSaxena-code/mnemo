# Mnemo

Mnemo is an engineering deja vu agent. Before a risky PR or ADR becomes a decision, it recalls similar past decisions from Hindsight and writes a short pre-mortem from the team's own history.

The product is built around one moment:

> "We tried something like this before. It looked reasonable then too. Here is what failed."

## What It Does

- Runs Hindsight recall before storing a new PR comment, Slack thread, or ADR.
- Uses Groq `qwen/qwen3-32b` to extract structured decisions and write concise pre-mortems.
- Tracks decision lifecycle: proposed, decided, reinforced, revisited, reversed, stale.
- Scores decision health based on age, reversal state, caveats, reinforcement count, source quality, and owner status.
- Shows a before/after "Without memory" vs "With Hindsight memory" answer for judge demos.
- Seeds 20 realistic devtools SaaS decisions across 18 months so the demo has real-feeling institutional history.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Hindsight Cloud via `@vectorize-io/hindsight-client`
- Groq via `groq-sdk`

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Add keys to `.env.local`:

```bash
GROQ_API_KEY=...
HINDSIGHT_API_KEY=...
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=mnemo-engineering-decisions
ENABLE_SEED_ROUTE=true
```

Open `http://localhost:3000`.

## Hindsight Credits

The hackathon PDFs say to use Hindsight Cloud and apply promo code `MEMHACK6` for $50 in free credits.

1. Register at Hindsight Cloud.
2. Open billing after registration.
3. Add promo code `MEMHACK6`.
4. Put the API key in `.env.local`.
5. Click **Seed Hindsight memory** in Mnemo's Source Inbox.

## Groq Cost Controls

Groq is a required integration, but the app avoids waste:

- Extraction uses strict JSON output, `temperature: 0`, and short `max_tokens`.
- Pre-mortems use only the top recalled memories, not the full bank.
- Chat synthesis is cached by question and memory IDs.
- Extraction is cached by source text hash.
- Demo seed data is already structured, so seeding does not need Groq.
- Re-running the same demo question should hit local cache.

Actions that call Groq:

- Running a pre-mortem for new text.
- Asking a memory-backed question for the first time.
- Asking the memory-off comparison for the first time.
- Ingesting a new source note that has not been extracted before.

Actions that do not need Groq:

- Viewing seed timeline.
- Seeding structured demo decisions to Hindsight.
- Re-opening cached answers.

## Demo Flow

1. Go to **Source Inbox** and click **Seed Hindsight memory**.
2. Go to **Pre-Mortem**.
3. Use the demo PR text about moving billing events back to Kafka.
4. Click **Run recall-before-retain**.
5. Show the warning:
   - Hindsight recall found the reversed Kafka billing decision.
   - Groq wrote a pre-mortem from that memory.
   - The evidence rail shows `Decided -> Incident -> Reversed`.
6. Click **Retain this decision** to store the new proposal as a revisit.
7. Go to **Ask Memory** and compare:
   - "Why did we move billing events away from Kafka?"
   - Without memory: generic tradeoffs.
   - With Hindsight memory: specific decision, people, date, and rejected alternatives.

## Why Hindsight Is Central

Mnemo is not just a chat UI over documents. It uses Hindsight in the core product loop:

- `recall` happens before storing a new decision, turning memory into a warning system.
- `retain` stores decisions and lifecycle events for future recall.
- Recall output feeds Groq's pre-mortem prompt, so the answer depends on institutional memory rather than generic LLM knowledge.

## GitHub Webhook

Set `GITHUB_WEBHOOK_SECRET`, then point a GitHub webhook at:

```text
POST /api/webhooks/github
```

Supported events:

- Issue comments
- Pull request review comments

Mnemo filters for decision-like language before running extraction and pre-mortem generation.

## Submission Notes

The content guide says article and social posts should not mention the hackathon. Keep public content focused on the engineering problem and Hindsight memory.

Useful angle:

> I built a Hindsight agent that warns when a PR repeats a mistake.

