import type { DecisionRecord } from "@/lib/types";

export const seedDecisions: DecisionRecord[] = [
  {
    id: "mem-kafka-sqs-2024-03",
    title: "Reversed Kafka for billing events after duplicate-charge incidents",
    decision: "Move billing event processing from Kafka to SQS FIFO with idempotency keys.",
    rationale:
      "Kafka gave stronger replay semantics, but the team did not have the operational maturity to keep partition ownership, exactly-once assumptions, and deploy coordination safe during billing releases.",
    alternatives: [
      { name: "Keep Kafka", rejectedBecause: "Duplicate processing during consumer rebalances caused two customer-visible billing corrections." },
      { name: "RabbitMQ", rejectedBecause: "The team had no production RabbitMQ expertise and did not want another broker to operate." }
    ],
    caveats: ["Revisit Kafka only if platform owns broker operations and billing has a replay simulator."],
    scope: "billing-events",
    people: ["Maya Patel", "Jon Bell", "Priya Shah"],
    date: "2024-03-18",
    state: "reversed",
    sourceType: "github",
    source: "PR #318 billing-event-pipeline",
    sourceUrl: "https://github.com/acme-devtools/mnemo-demo/pull/318#discussion_r1",
    tags: ["billing", "kafka", "sqs", "events", "reversal"],
    reinforcementCount: 5,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-kafka-decided",
        state: "decided",
        date: "2024-02-22",
        title: "Kafka chosen for billing ordering",
        summary: "Kafka was selected to preserve ordered billing event replay.",
        source: "ADR-014"
      },
      {
        id: "evt-kafka-incident",
        state: "revisited",
        date: "2024-03-11",
        title: "Duplicate charge correction",
        summary: "Consumer rebalance replayed payment_captured events without stable idempotency.",
        source: "INC-241"
      },
      {
        id: "evt-kafka-reversed",
        state: "reversed",
        date: "2024-03-18",
        title: "Reversed to SQS FIFO",
        summary: "The team moved to SQS FIFO and made idempotency keys mandatory.",
        source: "PR #318"
      }
    ],
    content:
      "Engineering decision in billing-events: On 2024-03-18, Maya Patel, Jon Bell, and Priya Shah reversed the Kafka billing event pipeline and moved to SQS FIFO with mandatory idempotency keys. Kafka was rejected because consumer rebalances caused duplicate processing and two customer-visible billing corrections. RabbitMQ was rejected because the team had no production expertise with it. Caveat: revisit Kafka only if platform owns broker operations and billing has a replay simulator."
  },
  {
    id: "mem-auth-sessions-2024-05",
    title: "Replaced long-lived JWT auth with server sessions",
    decision: "Use short server sessions backed by Redis instead of long-lived JWTs for the dashboard.",
    rationale:
      "Revocation needed to work immediately after customer offboarding and suspected token leakage; the stateless JWT setup could not provide that guarantee.",
    alternatives: [
      { name: "Shorter JWT TTL", rejectedBecause: "Still left an unacceptable revocation window for enterprise offboarding." },
      { name: "JWT denylist", rejectedBecause: "Reintroduced server state while preserving JWT complexity." }
    ],
    caveats: ["Session cache failures must fail closed for admin routes."],
    scope: "auth",
    people: ["Priya Shah", "Elena Ruiz"],
    date: "2024-05-07",
    state: "reinforced",
    sourceType: "adr",
    source: "ADR-019 auth-session-revocation",
    tags: ["auth", "jwt", "sessions", "security"],
    reinforcementCount: 8,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-auth-decided",
        state: "decided",
        date: "2024-05-07",
        title: "Sessions chosen for dashboard auth",
        summary: "Server sessions replaced long-lived JWTs to make revocation immediate.",
        source: "ADR-019"
      },
      {
        id: "evt-auth-reinforced",
        state: "reinforced",
        date: "2024-08-29",
        title: "Enterprise offboarding passed audit",
        summary: "The support team confirmed session revocation handled offboarding cases cleanly.",
        source: "SOC2 prep notes"
      }
    ],
    content:
      "Engineering decision in auth: On 2024-05-07, Priya Shah and Elena Ruiz replaced long-lived JWT dashboard auth with short server sessions backed by Redis. The reason was immediate revocation after customer offboarding and suspected token leakage. Shorter JWT TTL and a JWT denylist were rejected because they left revocation risk or added state without removing JWT complexity. Caveat: session cache failures must fail closed for admin routes."
  },
  {
    id: "mem-analytics-denorm-2024-08",
    title: "Denormalized project_event_rollups for dashboard latency",
    decision: "Denormalize project event counts into project_event_rollups instead of joining raw event tables at read time.",
    rationale:
      "Dashboard p95 load time dropped from 1.8s to 180ms when daily event aggregates were precomputed.",
    alternatives: [
      { name: "Keep normalized event joins", rejectedBecause: "Joins across raw events and project tables dominated dashboard latency." },
      { name: "Materialized view only", rejectedBecause: "Refresh lag was unpredictable during import spikes." }
    ],
    caveats: ["Rollup correctness must be checked by nightly reconciliation."],
    scope: "analytics",
    people: ["Carlos Vega", "Maya Patel"],
    date: "2024-08-14",
    state: "reinforced",
    sourceType: "github",
    source: "PR #472 project-event-rollups",
    tags: ["analytics", "postgres", "denormalization", "dashboard"],
    reinforcementCount: 11,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-rollups-decided",
        state: "decided",
        date: "2024-08-14",
        title: "Rollups introduced",
        summary: "Daily project event rollups replaced read-time joins.",
        source: "PR #472"
      },
      {
        id: "evt-rollups-reinforced",
        state: "reinforced",
        date: "2024-10-02",
        title: "Support dashboard incident avoided",
        summary: "Rollups absorbed a large customer import without dashboard degradation.",
        source: "Slack #eng-analytics"
      }
    ],
    content:
      "Engineering decision in analytics: On 2024-08-14, Carlos Vega and Maya Patel denormalized project event counts into project_event_rollups. The reason was dashboard p95 load time: precomputed rollups reduced dashboard loads from 1.8s to 180ms. Normalized joins were rejected because they dominated latency, and a materialized view was rejected because refresh lag was unpredictable during imports. Caveat: nightly reconciliation must check rollup correctness."
  },
  {
    id: "mem-flags-vendor-2024-09",
    title: "Abandoned internal feature flags for vendor-backed flags",
    decision: "Replace the internal feature flag service with a vendor SDK for customer-scoped rollout controls.",
    rationale:
      "The internal service could not support audit logs, segment previews, and emergency kill switches without turning into a product of its own.",
    alternatives: [
      { name: "Keep internal flags", rejectedBecause: "Missing audit trail created support and compliance risk." },
      { name: "Environment-variable flags", rejectedBecause: "Required deploys and could not target single enterprise tenants." }
    ],
    caveats: ["Do not put PII in flag attributes sent to the vendor."],
    scope: "feature-flags",
    people: ["Noah Kim", "Elena Ruiz"],
    date: "2024-09-03",
    state: "reversed",
    sourceType: "slack",
    source: "Slack #platform thread 2024-09-03",
    tags: ["feature-flags", "vendor", "audit", "rollout"],
    reinforcementCount: 4,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-flags-decided",
        state: "decided",
        date: "2024-01-19",
        title: "Internal flag service built",
        summary: "The team built a tiny internal flag service to avoid adding a vendor.",
        source: "ADR-011"
      },
      {
        id: "evt-flags-reversed",
        state: "reversed",
        date: "2024-09-03",
        title: "Vendor flags adopted",
        summary: "Audit and targeting needs exceeded the internal service scope.",
        source: "Slack #platform"
      }
    ],
    content:
      "Engineering decision in feature-flags: On 2024-09-03, Noah Kim and Elena Ruiz replaced the internal feature flag service with a vendor SDK. The internal service was rejected because audit logs, segment previews, and emergency kill switches were becoming a product of their own. Environment-variable flags were rejected because they required deploys and could not target single enterprise tenants. Caveat: do not put PII in vendor flag attributes."
  },
  {
    id: "mem-tenant-isolation-2024-11",
    title: "Patched analytics tenant shortcut after isolation review",
    decision: "Require tenant_id predicates through a query builder for all analytics reads.",
    rationale:
      "A support-only shortcut relied on callers to add tenant filters manually, which was too easy to forget during dashboard maintenance.",
    alternatives: [
      { name: "Code review checklist", rejectedBecause: "Human review was not a reliable isolation boundary." },
      { name: "Separate database per tenant", rejectedBecause: "Too large a migration for current enterprise volume." }
    ],
    caveats: ["Revisit database-per-tenant if regulated customers exceed 20% of ARR."],
    scope: "multi-tenant-analytics",
    people: ["Elena Ruiz", "Carlos Vega", "Priya Shah"],
    date: "2024-11-12",
    state: "reinforced",
    sourceType: "github",
    source: "PR #611 tenant-safe-query-builder",
    tags: ["tenant-isolation", "analytics", "security", "query-builder"],
    reinforcementCount: 6,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-tenant-revisited",
        state: "revisited",
        date: "2024-11-04",
        title: "Isolation shortcut flagged",
        summary: "Security review found manual tenant filters in support analytics paths.",
        source: "Security review"
      },
      {
        id: "evt-tenant-decided",
        state: "decided",
        date: "2024-11-12",
        title: "Tenant-safe builder required",
        summary: "Analytics reads must use a query builder that injects tenant predicates.",
        source: "PR #611"
      }
    ],
    content:
      "Engineering decision in multi-tenant analytics: On 2024-11-12, Elena Ruiz, Carlos Vega, and Priya Shah required tenant_id predicates through a query builder for all analytics reads. Manual code review was rejected because human review is not a reliable isolation boundary. Separate databases per tenant were rejected as too large a migration for current volume. Caveat: revisit database-per-tenant if regulated customers exceed 20% of ARR."
  },
  {
    id: "mem-ci-parallel-2025-01",
    title: "Limited CI parallelization after flaky deploys",
    decision: "Keep test parallelization for unit suites but serialize migration and browser tests.",
    rationale:
      "Full parallelization cut CI time but created non-deterministic failures around shared test databases and browser auth state.",
    alternatives: [
      { name: "Fully parallel CI", rejectedBecause: "Flakiness hid real deploy blockers and wasted review time." },
      { name: "Fully serial CI", rejectedBecause: "Too slow for normal PR iteration." }
    ],
    caveats: ["Revisit once test databases are isolated per worker."],
    scope: "ci-cd",
    people: ["Jon Bell", "Noah Kim"],
    date: "2025-01-21",
    state: "revisited",
    sourceType: "github",
    source: "PR #702 ci-test-topology",
    tags: ["ci", "testing", "flaky-tests", "deploy"],
    reinforcementCount: 3,
    authorStatus: "left",
    lifecycle: [
      {
        id: "evt-ci-decided",
        state: "decided",
        date: "2024-12-18",
        title: "Full CI parallelization adopted",
        summary: "The team parallelized every suite to reduce PR wait time.",
        source: "PR #680"
      },
      {
        id: "evt-ci-revisited",
        state: "revisited",
        date: "2025-01-21",
        title: "Migration and browser suites serialized",
        summary: "Shared database and auth-state flakes forced partial serialization.",
        source: "PR #702"
      }
    ],
    content:
      "Engineering decision in CI/CD: On 2025-01-21, Jon Bell and Noah Kim kept unit test parallelization but serialized migration and browser tests. Full parallel CI was rejected because flakiness hid real deploy blockers. Fully serial CI was rejected because PR iteration was too slow. Caveat: revisit once test databases are isolated per worker. Jon later left the company, so this decision should be revalidated if the CI topology changes."
  },
  {
    id: "mem-sdk-versioning-2025-02",
    title: "Reinforced no silent SDK breaking changes",
    decision: "Ship breaking SDK changes only in major versions with migration notes and a two-release deprecation window.",
    rationale:
      "Silent shape changes in the TypeScript SDK created support escalations for customers who pinned minor versions loosely.",
    alternatives: [
      { name: "Minor-version breaking changes", rejectedBecause: "Enterprise customers treat minor updates as safe." },
      { name: "Runtime compatibility shim forever", rejectedBecause: "Would make SDK internals brittle and undocumented." }
    ],
    caveats: ["Emergency security changes can bypass the window with customer comms."],
    scope: "sdk",
    people: ["Ari Chen", "Maya Patel"],
    date: "2025-02-10",
    state: "reinforced",
    sourceType: "adr",
    source: "ADR-027 sdk-versioning",
    tags: ["sdk", "versioning", "support", "deprecation"],
    reinforcementCount: 9,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-sdk-decided",
        state: "decided",
        date: "2025-02-10",
        title: "SDK major-version policy adopted",
        summary: "Breaking changes require major versions and migration notes.",
        source: "ADR-027"
      },
      {
        id: "evt-sdk-reinforced",
        state: "reinforced",
        date: "2025-04-03",
        title: "Deprecation window prevented incident",
        summary: "A planned client rename landed without support escalations.",
        source: "Support review"
      }
    ],
    content:
      "Engineering decision in SDK: On 2025-02-10, Ari Chen and Maya Patel decided breaking SDK changes ship only in major versions with migration notes and a two-release deprecation window. Minor-version breaking changes were rejected because enterprise customers treat minor updates as safe. A permanent compatibility shim was rejected because it would make internals brittle. Caveat: emergency security changes can bypass the window with customer comms."
  },
  {
    id: "mem-rate-limits-2025-03",
    title: "Per-tenant adaptive rate limits beat global throttles",
    decision: "Use per-tenant adaptive rate limits for ingestion APIs rather than a single global throttle.",
    rationale:
      "Global throttles punished small tenants during large customer backfills and made support tickets look unrelated to the true noisy neighbor.",
    alternatives: [
      { name: "Global throttle", rejectedBecause: "Allowed one import-heavy tenant to degrade everyone." },
      { name: "No throttling", rejectedBecause: "Backfills could starve normal event ingestion." }
    ],
    caveats: ["Expose tenant limit state to support before enforcing hard blocks."],
    scope: "ingestion-api",
    people: ["Noah Kim", "Carlos Vega"],
    date: "2025-03-06",
    state: "decided",
    sourceType: "github",
    source: "PR #746 adaptive-tenant-rate-limits",
    tags: ["rate-limits", "ingestion", "tenancy", "api"],
    reinforcementCount: 2,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-rate-decided",
        state: "decided",
        date: "2025-03-06",
        title: "Adaptive per-tenant limits added",
        summary: "Ingestion limits became tenant-aware to isolate noisy neighbors.",
        source: "PR #746"
      }
    ],
    content:
      "Engineering decision in ingestion-api: On 2025-03-06, Noah Kim and Carlos Vega chose per-tenant adaptive rate limits instead of one global throttle. Global throttles were rejected because import-heavy tenants degraded everyone. No throttling was rejected because backfills could starve normal event ingestion. Caveat: expose tenant limit state to support before enforcing hard blocks."
  },
  {
    id: "mem-observability-2025-03",
    title: "Required trace IDs across worker boundaries",
    decision: "Propagate trace IDs through queue payloads and worker logs.",
    rationale:
      "Incidents involving delayed jobs took too long to debug because API logs and worker logs could not be stitched together.",
    alternatives: [
      { name: "Search by customer ID", rejectedBecause: "Too noisy during multi-customer incidents." },
      { name: "Manual incident notes", rejectedBecause: "Did not help during active triage." }
    ],
    caveats: ["Queue payloads must not include sensitive request body fields."],
    scope: "observability",
    people: ["Priya Shah", "Jon Bell"],
    date: "2025-03-28",
    state: "reinforced",
    sourceType: "slack",
    source: "Slack #incident-review 2025-03-28",
    tags: ["observability", "tracing", "workers", "queues"],
    reinforcementCount: 7,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-trace-decided",
        state: "decided",
        date: "2025-03-28",
        title: "Trace IDs required in queues",
        summary: "Trace IDs became mandatory across API and worker boundaries.",
        source: "Incident review"
      }
    ],
    content:
      "Engineering decision in observability: On 2025-03-28, Priya Shah and Jon Bell required trace IDs through queue payloads and worker logs. Searching by customer ID was rejected as too noisy during multi-customer incidents. Manual incident notes were rejected because they do not help during active triage. Caveat: queue payloads must not include sensitive request body fields."
  },
  {
    id: "mem-webhook-idempotency-2025-04",
    title: "Made incoming webhooks idempotent by provider event ID",
    decision: "Deduplicate incoming integration webhooks by provider event ID with a 30-day retention table.",
    rationale:
      "Providers retry aggressively and customers saw duplicated deployment annotations when network timeouts occurred after successful writes.",
    alternatives: [
      { name: "Timestamp-window dedupe", rejectedBecause: "Collapsed legitimate repeated events from busy CI systems." },
      { name: "Trust provider retries", rejectedBecause: "Timeouts after success still caused duplicate side effects." }
    ],
    caveats: ["Provider event IDs must be normalized before dedupe."],
    scope: "integrations",
    people: ["Ari Chen", "Noah Kim"],
    date: "2025-04-16",
    state: "decided",
    sourceType: "github",
    source: "PR #788 webhook-idempotency",
    tags: ["webhooks", "idempotency", "integrations"],
    reinforcementCount: 3,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-webhook-decided",
        state: "decided",
        date: "2025-04-16",
        title: "Provider event ID dedupe",
        summary: "Incoming webhooks are deduplicated by provider event ID.",
        source: "PR #788"
      }
    ],
    content:
      "Engineering decision in integrations: On 2025-04-16, Ari Chen and Noah Kim deduplicated incoming integration webhooks by provider event ID with a 30-day retention table. Timestamp-window dedupe was rejected because it collapsed legitimate repeated events from busy CI systems. Trusting provider retries was rejected because timeout-after-success still caused duplicate side effects. Caveat: provider event IDs must be normalized before dedupe."
  },
  {
    id: "mem-background-jobs-2025-06",
    title: "Split long-running imports out of request handlers",
    decision: "Move customer imports into background jobs with resumable checkpoints.",
    rationale:
      "Large imports exceeded request timeouts and made retry behavior ambiguous for customer success.",
    alternatives: [
      { name: "Increase request timeout", rejectedBecause: "Would tie up web workers and still fail on client disconnects." },
      { name: "Chunk uploads manually", rejectedBecause: "Pushed complexity onto customers." }
    ],
    caveats: ["Checkpoint format must remain backward compatible for 90 days."],
    scope: "imports",
    people: ["Elena Ruiz", "Jon Bell"],
    date: "2025-06-17",
    state: "reinforced",
    sourceType: "github",
    source: "PR #830 resumable-import-jobs",
    tags: ["imports", "jobs", "resumability"],
    reinforcementCount: 6,
    authorStatus: "left",
    lifecycle: [
      {
        id: "evt-jobs-decided",
        state: "decided",
        date: "2025-06-17",
        title: "Imports moved to jobs",
        summary: "Customer imports became resumable background jobs.",
        source: "PR #830"
      }
    ],
    content:
      "Engineering decision in imports: On 2025-06-17, Elena Ruiz and Jon Bell moved customer imports into background jobs with resumable checkpoints. Increasing request timeout was rejected because it tied up web workers and still failed on client disconnects. Manual chunk uploads were rejected because they pushed complexity onto customers. Caveat: checkpoint format must remain backward compatible for 90 days."
  },
  {
    id: "mem-billing-ledger-2025-07",
    title: "Made billing ledger append-only",
    decision: "Use append-only ledger entries for billing adjustments instead of mutating invoice rows.",
    rationale:
      "Support needed a clear audit trail for credits, reversals, and enterprise billing disputes.",
    alternatives: [
      { name: "Mutate invoice rows", rejectedBecause: "Destroyed audit history and complicated dispute review." },
      { name: "Store adjustments in notes", rejectedBecause: "Could not be reconciled by finance tooling." }
    ],
    caveats: ["Every adjustment requires a reason code."],
    scope: "billing-ledger",
    people: ["Priya Shah", "Ari Chen"],
    date: "2025-07-02",
    state: "decided",
    sourceType: "adr",
    source: "ADR-034 append-only-ledger",
    tags: ["billing", "ledger", "audit"],
    reinforcementCount: 4,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-ledger-decided",
        state: "decided",
        date: "2025-07-02",
        title: "Append-only ledger adopted",
        summary: "Billing adjustments became append-only ledger entries.",
        source: "ADR-034"
      }
    ],
    content:
      "Engineering decision in billing-ledger: On 2025-07-02, Priya Shah and Ari Chen used append-only ledger entries for billing adjustments instead of mutating invoice rows. Mutating invoice rows was rejected because it destroyed audit history. Storing adjustments in notes was rejected because finance tooling could not reconcile it. Caveat: every adjustment requires a reason code."
  },
  {
    id: "mem-cache-invalidation-2025-08",
    title: "Removed cross-service cache invalidation messages",
    decision: "Use short TTLs and versioned cache keys instead of cross-service invalidation messages.",
    rationale:
      "Invalidation messages created hidden coupling and ordering bugs during deploys.",
    alternatives: [
      { name: "Cross-service invalidation bus", rejectedBecause: "Consumers could miss invalidations during deploys and serve stale plans." },
      { name: "No cache", rejectedBecause: "Plan lookups would overload the billing database." }
    ],
    caveats: ["High-value enterprise plan changes trigger explicit cache bust from admin UI."],
    scope: "caching",
    people: ["Maya Patel", "Noah Kim"],
    date: "2025-08-20",
    state: "reversed",
    sourceType: "slack",
    source: "Slack #architecture 2025-08-20",
    tags: ["cache", "invalidation", "billing", "deploys"],
    reinforcementCount: 2,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-cache-decided",
        state: "decided",
        date: "2025-07-18",
        title: "Invalidation messages added",
        summary: "Services sent cache invalidation messages after plan updates.",
        source: "PR #862"
      },
      {
        id: "evt-cache-reversed",
        state: "reversed",
        date: "2025-08-20",
        title: "Invalidation messages removed",
        summary: "Short TTLs and versioned keys replaced invalidation messages.",
        source: "Slack #architecture"
      }
    ],
    content:
      "Engineering decision in caching: On 2025-08-20, Maya Patel and Noah Kim removed cross-service cache invalidation messages and used short TTLs with versioned cache keys. The invalidation bus was rejected because consumers could miss invalidations during deploys and serve stale plans. No cache was rejected because plan lookups would overload billing. Caveat: high-value enterprise plan changes trigger explicit cache bust from admin UI."
  },
  {
    id: "mem-api-errors-2025-09",
    title: "Standardized API errors with machine-readable codes",
    decision: "Return stable machine-readable error codes for public API failures.",
    rationale:
      "Customers were parsing English error strings in automation, making harmless copy edits breaking changes.",
    alternatives: [
      { name: "English-only errors", rejectedBecause: "Broke customer scripts when copy changed." },
      { name: "HTTP status only", rejectedBecause: "Could not distinguish actionable integration failures." }
    ],
    caveats: ["Error code removals follow SDK deprecation policy."],
    scope: "public-api",
    people: ["Ari Chen", "Elena Ruiz"],
    date: "2025-09-04",
    state: "reinforced",
    sourceType: "github",
    source: "PR #901 public-api-error-codes",
    tags: ["api", "errors", "sdk", "compatibility"],
    reinforcementCount: 5,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-errors-decided",
        state: "decided",
        date: "2025-09-04",
        title: "Machine-readable error codes",
        summary: "Public API failures gained stable machine-readable error codes.",
        source: "PR #901"
      }
    ],
    content:
      "Engineering decision in public-api: On 2025-09-04, Ari Chen and Elena Ruiz standardized public API failures on stable machine-readable error codes. English-only errors were rejected because customers parsed strings and broke when copy changed. HTTP status only was rejected because it could not distinguish actionable integration failures. Caveat: error code removals follow SDK deprecation policy."
  },
  {
    id: "mem-regional-storage-2025-10",
    title: "Deferred regional data residency until enterprise contracts required it",
    decision: "Keep metadata storage in one US region while encrypting tenant data and documenting residency limits.",
    rationale:
      "Regional storage would multiply operational complexity before the sales pipeline had signed data-residency requirements.",
    alternatives: [
      { name: "Multi-region storage now", rejectedBecause: "Would slow every schema migration and incident response path." },
      { name: "Promise EU residency in sales", rejectedBecause: "Product could not truthfully support it yet." }
    ],
    caveats: ["Revisit when two signed enterprise contracts require EU residency."],
    scope: "data-residency",
    people: ["Elena Ruiz", "Maya Patel"],
    date: "2025-10-13",
    state: "stale",
    sourceType: "adr",
    source: "ADR-039 data-residency",
    tags: ["data-residency", "enterprise", "storage", "compliance"],
    reinforcementCount: 0,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-region-decided",
        state: "decided",
        date: "2025-10-13",
        title: "Regional storage deferred",
        summary: "The team deferred regional storage until contracts required it.",
        source: "ADR-039"
      }
    ],
    content:
      "Engineering decision in data-residency: On 2025-10-13, Elena Ruiz and Maya Patel kept metadata storage in one US region while encrypting tenant data and documenting residency limits. Multi-region storage was rejected because it would slow schema migrations and incident response. Promising EU residency in sales was rejected because the product could not support it yet. Caveat: revisit when two signed enterprise contracts require EU residency."
  },
  {
    id: "mem-ai-summaries-2025-11",
    title: "Kept AI summaries human-approved for customer-facing notes",
    decision: "Require human approval before publishing AI-generated customer-facing incident summaries.",
    rationale:
      "The model produced plausible but overconfident root-cause language during an incident draft.",
    alternatives: [
      { name: "Auto-publish AI summaries", rejectedBecause: "Risked publishing unverified root causes." },
      { name: "Ban AI summaries", rejectedBecause: "Drafts still saved incident commanders time." }
    ],
    caveats: ["Internal-only summaries may remain automatic with clear labels."],
    scope: "incident-comms",
    people: ["Priya Shah", "Noah Kim"],
    date: "2025-11-06",
    state: "decided",
    sourceType: "slack",
    source: "Slack #incident-review 2025-11-06",
    tags: ["ai", "incident-comms", "approval", "customers"],
    reinforcementCount: 2,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-ai-summary-decided",
        state: "decided",
        date: "2025-11-06",
        title: "Human approval required",
        summary: "Customer-facing AI incident summaries require human approval.",
        source: "Incident review"
      }
    ],
    content:
      "Engineering decision in incident-comms: On 2025-11-06, Priya Shah and Noah Kim required human approval before publishing AI-generated customer-facing incident summaries. Auto-publishing was rejected because the model produced plausible but overconfident root-cause language. Banning AI summaries was rejected because drafts saved time. Caveat: internal-only summaries may remain automatic with clear labels."
  },
  {
    id: "mem-secrets-scanning-2025-12",
    title: "Blocked deploys on newly detected secrets",
    decision: "Block production deploys when secret scanning finds a new high-confidence secret in the diff.",
    rationale:
      "A warning-only scanner was ignored during a rushed hotfix and a token reached a staging image.",
    alternatives: [
      { name: "Warning-only scanner", rejectedBecause: "Ignored during hotfix pressure." },
      { name: "Nightly secret scan", rejectedBecause: "Detected leaks after artifacts were already built." }
    ],
    caveats: ["Security can override after rotating the credential and documenting the incident."],
    scope: "deployment-security",
    people: ["Elena Ruiz", "Jon Bell"],
    date: "2025-12-02",
    state: "reinforced",
    sourceType: "github",
    source: "PR #982 block-secret-deploys",
    tags: ["security", "secrets", "deploy", "ci"],
    reinforcementCount: 4,
    authorStatus: "left",
    lifecycle: [
      {
        id: "evt-secrets-decided",
        state: "decided",
        date: "2025-12-02",
        title: "Deploys blocked on secrets",
        summary: "High-confidence new secrets block production deploys.",
        source: "PR #982"
      }
    ],
    content:
      "Engineering decision in deployment-security: On 2025-12-02, Elena Ruiz and Jon Bell blocked production deploys when secret scanning finds a new high-confidence secret in the diff. Warning-only scanning was rejected because it was ignored during hotfix pressure. Nightly scans were rejected because they detect leaks after artifacts are built. Caveat: security can override after rotating the credential and documenting the incident."
  },
  {
    id: "mem-pr-templates-2026-01",
    title: "Added decision checkboxes to PR templates",
    decision: "Add architecture-decision prompts to PR templates for changes touching auth, billing, data, or CI.",
    rationale:
      "Important decisions were hiding in review comments and never became searchable institutional memory.",
    alternatives: [
      { name: "ADR-only policy", rejectedBecause: "Engineers skipped ADRs for medium-sized changes." },
      { name: "No template prompts", rejectedBecause: "Reviewers remembered decisions but new hires could not find them." }
    ],
    caveats: ["Template prompts must stay short or reviewers will ignore them."],
    scope: "engineering-process",
    people: ["Maya Patel", "Ari Chen"],
    date: "2026-01-15",
    state: "decided",
    sourceType: "github",
    source: "PR #1007 architecture-decision-template",
    tags: ["process", "adr", "pull-requests", "memory"],
    reinforcementCount: 1,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-template-decided",
        state: "decided",
        date: "2026-01-15",
        title: "PR template prompts added",
        summary: "PRs touching sensitive areas ask whether a decision should be retained.",
        source: "PR #1007"
      }
    ],
    content:
      "Engineering decision in engineering-process: On 2026-01-15, Maya Patel and Ari Chen added architecture-decision prompts to PR templates for auth, billing, data, and CI changes. ADR-only policy was rejected because engineers skipped ADRs for medium-sized changes. No template prompts were rejected because decisions stayed hidden in review comments. Caveat: prompts must stay short or reviewers will ignore them."
  },
  {
    id: "mem-retry-policy-2026-02",
    title: "Standardized exponential backoff with jitter",
    decision: "Use bounded exponential backoff with jitter for all outbound integration retries.",
    rationale:
      "Linear retries synchronized across tenants and amplified provider outages.",
    alternatives: [
      { name: "Linear retry", rejectedBecause: "Synchronized retry storms during provider incidents." },
      { name: "Unlimited retry", rejectedBecause: "Could keep dead jobs alive indefinitely and hide failures." }
    ],
    caveats: ["Customer-visible integrations surface final failure after five attempts."],
    scope: "integrations",
    people: ["Noah Kim", "Priya Shah"],
    date: "2026-02-11",
    state: "reinforced",
    sourceType: "adr",
    source: "ADR-044 retry-policy",
    tags: ["retries", "integrations", "backoff", "outages"],
    reinforcementCount: 3,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-retry-decided",
        state: "decided",
        date: "2026-02-11",
        title: "Bounded jittered retries standardized",
        summary: "Outbound integrations use bounded exponential backoff with jitter.",
        source: "ADR-044"
      }
    ],
    content:
      "Engineering decision in integrations: On 2026-02-11, Noah Kim and Priya Shah standardized bounded exponential backoff with jitter for outbound integration retries. Linear retry was rejected because synchronized tenants amplified provider outages. Unlimited retry was rejected because it hid failures. Caveat: customer-visible integrations surface final failure after five attempts."
  },
  {
    id: "mem-delete-audit-2026-03",
    title: "Separated soft delete from audit retention",
    decision: "Soft-delete user-visible records while retaining immutable audit events separately.",
    rationale:
      "Support needed restore capability, but compliance needed proof of deletion and retention boundaries.",
    alternatives: [
      { name: "Hard delete everything", rejectedBecause: "Made accidental customer deletions unrecoverable." },
      { name: "Soft delete only", rejectedBecause: "Could blur the difference between product state and compliance audit state." }
    ],
    caveats: ["Audit payloads must not contain the full deleted object."],
    scope: "data-lifecycle",
    people: ["Elena Ruiz", "Carlos Vega"],
    date: "2026-03-19",
    state: "decided",
    sourceType: "github",
    source: "PR #1074 audit-retention-delete",
    tags: ["deletion", "audit", "compliance", "data-lifecycle"],
    reinforcementCount: 1,
    authorStatus: "active",
    lifecycle: [
      {
        id: "evt-delete-decided",
        state: "decided",
        date: "2026-03-19",
        title: "Audit retention separated",
        summary: "User-visible soft delete and immutable audit events became separate paths.",
        source: "PR #1074"
      }
    ],
    content:
      "Engineering decision in data-lifecycle: On 2026-03-19, Elena Ruiz and Carlos Vega separated user-visible soft deletes from immutable audit events. Hard delete everything was rejected because accidental customer deletions were unrecoverable. Soft delete only was rejected because it blurred product state and compliance audit state. Caveat: audit payloads must not contain the full deleted object."
  }
];

export const demoProposal =
  "In PR #1142 I think we should move billing event processing back to Kafka so we can get stronger ordering guarantees and replay failed invoice events. SQS FIFO feels too limiting for upcoming enterprise billing exports.";
