# Mnemo Demo Script

## 0:00-0:30 - Intro

Hi, I built Mnemo, an engineering deja vu agent. It helps teams avoid repeating architectural mistakes by using Hindsight as institutional memory.

The problem is familiar: six months later, nobody remembers why Kafka was rolled back, why auth uses sessions, or why a table was denormalized. Mnemo turns those old decisions into pre-merge caution.

## 0:30-1:00 - Show The Problem

Open **Ask Memory**.

Ask: "Why did we move billing events away from Kafka?"

Show **Without memory** first. It gives generic Kafka/SQS tradeoffs but cannot know what this team tried.

Then show **With Hindsight memory**. It names the March 2024 billing decision, the duplicate-charge incident, the rejected alternatives, and the people involved.

## 1:00-2:30 - Live Pre-Mortem

Open **Pre-Mortem**.

Paste the demo PR:

> Let's move billing event processing back to Kafka so we can get stronger ordering guarantees and replay failed invoice events.

Click **Run recall-before-retain**.

Narration:

Mnemo calls Hindsight recall before it stores the new proposal. That is the key design choice. It is not just remembering after the fact; it is checking whether this PR has historical risk.

Show:

- Critical deja vu warning.
- Groq-generated pre-mortem.
- Three failure modes.
- Evidence from the old Kafka reversal.
- Lifecycle arc: Decided -> Incident -> Reversed.
- Health score: Reversed.

## 2:30-3:15 - Retain The New Decision

Click **Retain this decision**.

Explain that Mnemo now stores this proposal as a new lifecycle event in Hindsight. If the team intentionally chooses Kafka again, future engineers will see both the old reversal and the new reason.

## 3:15-3:45 - Onboarding

Open **Onboarding Brief**.

Generate a brief for `billing-events`.

Show that a new engineer gets the handful of decisions that matter before touching billing.

## 3:45-4:00 - Wrap

The takeaway: memory is more useful when it becomes forward-looking. Mnemo uses Hindsight to turn old engineering scars into pre-merge warnings.

