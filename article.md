# I Built a Hindsight Agent That Warns Before We Repeat Mistakes

## Hook

Every engineering team has a few decisions that only exist in people's heads.

Six months later, those people are busy, gone, or tired of explaining why the auth flow looks strange. The team repeats an old debate, rebuilds a rejected approach, or rediscovers the same production edge case the hard way.

## What Mnemo Does

Mnemo is an engineering deja vu agent. It reads PR comments, Slack-style threads, and ADR drafts, then uses Hindsight to remember technical decisions as institutional memory.

The twist is that Mnemo does not wait for someone to ask a question. Before a new proposal is retained, it recalls similar past decisions and writes a pre-mortem.

## The Core Loop

```ts
const { memories } = await recallRelevantMemories(proposal, { topK: 5 });
const premortem = await generatePremortemFromGroq(proposal, memories);
await hindsight.retain(bankId, decisionContent, { context, timestamp, metadata });
```

The important part is the order: recall before retain.

## Why Hindsight Matters

Basic search can find documents. Hindsight is useful here because the product needs memory that compounds over time: decisions, reversals, caveats, and repeated references become a working model of the codebase's history.

## The Demo Moment

The demo PR proposes moving billing event processing back to Kafka.

Without memory, the agent gives normal Kafka versus SQS tradeoffs.

With Hindsight memory, Mnemo recalls that this team tried Kafka for billing events in March 2024, rolled it back after duplicate-charge incidents, and moved to SQS FIFO with idempotency keys.

## Lessons

- Memory is stronger when it is proactive.
- Reversals are more valuable than pristine decisions.
- Synthetic history matters for demos because empty memory makes every memory product look weak.
- Pre-mortems are a better interface than generic search for risky engineering changes.

