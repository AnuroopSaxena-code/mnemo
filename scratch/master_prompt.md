<USER_REQUEST>
yes, before you continue, go through the ENTIRE CODE. What I am going to say ahead is every single thing that should be there, so read EVERYTHING CAREFULLY. DONT MAKE ANY MISTAKES. THIS IS THE LAST STRETCH:
# Mnemo — Master Implementation Prompt
# This is the single source of truth for everything Mnemo is and does.
# Drop this into Claude Code at your repo root and implement top to bottom.

---

## What Mnemo is

Mnemo is an institutional memory engine for engineering teams. It remembers
every architectural decision a team makes — why they chose Kafka over SQS,
why that table is denormalized, why auth lives at the gateway — and surfaces
that knowledge anywhere the team works: the web app, Discord, Slack, and
GitHub pull requests.

The core insight: code tells you what was built. Mnemo tells you why.

Without Mnemo, this knowledge lives in people's heads, gets lost when
engineers leave, and gets repeated every time a new engineer asks "why is
this like this?" With Mnemo, every decision is retained in a memory layer
(Hindsight by Vectorize) and recalled semantically — meaning you can ask
in plain English and get the right answer even if the exact words don't match.

Mnemo is NOT a search tool for PR comments. It is an agent that:
- Detects when a team is about to repeat a past mistake (déjà vu detector)
- Warns before a PR merges if a similar decision was previously reversed
- Generates onboarding briefs for new engineers
- Tracks decision health over time (staleness, reversals, orphaned choices)

---

## Tech stack

- Framework: Next.js 14 App Router, TypeScript
- Styling: Tailwind CSS (layout only), custom CSS variables for all visual design
- Animation: Framer Motion (all transitions)
- Memory: Hindsight SDK (@hindsight-ai/sdk) — Hindsight Cloud
- LLM: Groq API (model: qwen-qwen3-32b, temperature 0 for extraction,
  0.1 for answers)
- Database: PostgreSQL via Prisma ORM
- Auth: GitHub OAuth (custom, no NextAuth)
- Bots: discord.js (Discord), Slac
<truncated 28593 bytes>
callback
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_REDIRECT_URI=https://mnemo.dev/api/integrations/slack/callback
GROQ_API_KEY=
DATABASE_URL=
TOKEN_ENCRYPTION_KEY=           # 32 bytes hex
SESSION_SECRET=
NEXT_PUBLIC_APP_URL=https://mnemo.dev
```

---

## Part 10: The demo flow (what judges see in 3 minutes)

1. Open mnemo.dev → cinematic landing page, scrolling decision fragments
2. Click CTA → GitHub OAuth → workspace auto-created
3. Connect "acme/api" repo (30 seconds)
4. Show memory is empty: "0 decisions"
5. Paste a PR comment into pre-mortem agent:
   "moving back to Kafka for billing — need stronger ordering guarantees"
6. Run analysis → déjà vu fires → warning: "You moved off Kafka in 2024
   for ops overhead. That decision was later reversed in July 2024."
7. Retain the decision → pipeline trail fills step by step
8. Switch to Ask Memory tab → type "why did we leave Kafka?" → answer
   arrives sentence by sentence with source metadata
9. Switch to Discord (screen share) → /lore why did we leave Kafka?
   → same answer, same memory, different surface
10. Show Slack → /lore what's the status of the billing service migration?
    → answer from memory
11. Open GitHub → show PR check posted by Mnemo: "⚠ Decision conflict detected"
12. Switch to Decision Timeline → all decisions plotted, one red node
    (the reversal), click it → full detail zooms in

Three surfaces. One memory. Total isolation. Every decision remembered.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-05T16:33:42+05:30.

The user's current state is as follows:
Active Document: c:\Users\anuro\Documents\Mnemo\.env.local (LANGUAGE_UNSPECIFIED)
Cursor is on line: 1
Other open documents:
- c:\Users\anuro\Documents\Mnemo\.env.local (LANGUAGE_UNSPECIFIED)
- c:\Users\anuro\Documents\Mnemo\scratch\test-hindsight.js (LANGUAGE_JAVASCRIPT)
- c:\Users\anuro\Documents\Mnemo\.env.local.example (LANGUAGE_UNSPECIFIED)
</ADDITIONAL_METADATA>