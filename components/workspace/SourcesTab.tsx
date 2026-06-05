"use client";

import type { SourceType } from "@/lib/types";

interface IngestionItem {
  id: string;
  sourceType: SourceType;
  sourceDetail: string;
  author: string;
  time: string;
  content: string;
  riskProfile: string;
}

interface SourcesTabProps {
  onLoadProposal: (
    text: string,
    sourceType: SourceType,
    sourceDetail: string
  ) => void;
}

const INGESTION_FEED: IngestionItem[] = [
  {
    id: "ing-1",
    sourceType: "github",
    sourceDetail: "PR #1142 billing-orders",
    author: "Jon Bell",
    time: "4 minutes ago",
    content:
      "In PR #1142 I think we should move billing event processing back to Kafka so we can get stronger ordering guarantees and replay failed invoice events. SQS FIFO feels too limiting for upcoming enterprise billing exports.",
    riskProfile:
      "CRITICAL: Repeated Reversal (Kafka was previously reversed back to SQS due to duplicate billing incidents)",
  },
  {
    id: "ing-2",
    sourceType: "discord",
    sourceDetail: "Discord #auth-channel",
    author: "Elena Ruiz",
    time: "2 hours ago",
    content:
      "@here We should switch dashboard logins back to long-lived JWTs to bypass Redis session lookups, which are causing latency overheads during load spikes.",
    riskProfile:
      "HIGH WARNING: Re-opening JWT Sessions (JWTs were replaced by sessions to support immediate revocation auditing)",
  },
  {
    id: "ing-3",
    sourceType: "whatsapp",
    sourceDetail: "WhatsApp #dev-updates",
    author: "Noah Kim",
    time: "1 day ago",
    content:
      "I want to build a quick internal feature flag service using environment variables rather than paying for a vendor license again.",
    riskProfile:
      "HIGH WARNING: Rebuilding feature flags (an internal service was previously abandoned in favor of vendor controls)",
  },
  {
    id: "ing-4",
    sourceType: "github",
    sourceDetail: "PR #1092 ci-config",
    author: "Jon Bell",
    time: "2 days ago",
    content:
      "Let's parallelize all tests in GitHub Actions including database migrations to speed up our deploy pipeline.",
    riskProfile:
      "MEDIUM WARNING: Flaky parallel CI de-synchronization risk",
  },
  {
    id: "ing-5",
    sourceType: "discord",
    sourceDetail: "Discord #sdk-alerts",
    author: "Ari Chen",
    time: "3 days ago",
    content:
      "I will make the response fields optional in this minor SDK release so we don't have to bump the major version.",
    riskProfile:
      "MEDIUM WARNING: Breaking change policy override risk",
  },
];

export function SourcesTab({ onLoadProposal }: SourcesTabProps) {
  return (
    <div
      style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minHeight: "100vh",
        maxWidth: "800px",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "16px",
        }}
      >
        <h2
          className="font-heading"
          style={{
            fontSize: "18px",
            color: "var(--color-ink)",
            fontWeight: 400,
            margin: "0 0 4px",
          }}
        >
          Source Ingestion Feed
        </h2>
        <p
          className="font-mono"
          style={{
            fontSize: "11px",
            color: "var(--color-ink-muted)",
            margin: 0,
          }}
        >
          Live inbox of GitHub webhooks, Discord threads, and WhatsApp updates.
        </p>
      </header>

      {/* Ingestion Feed */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {INGESTION_FEED.map((item) => {
          const isCritical = item.riskProfile.includes("CRITICAL");

          return (
            <div
              key={item.id}
              style={{
                background: "var(--color-surface-1)",
                borderLeft: `2px solid ${isCritical ? "var(--color-error)" : "var(--color-warn)"}`,
                borderRadius: "var(--radius)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Top metadata */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "9px",
                      color: "var(--color-accent)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {item.sourceType}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: "var(--color-ink)",
                      fontWeight: "bold",
                    }}
                  >
                    {item.sourceDetail}
                  </span>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    color: "var(--color-ink-muted)",
                  }}
                >
                  {item.time}
                </span>
              </div>

              {/* Author and content */}
              <div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    color: "var(--color-accent)",
                    marginRight: "8px",
                  }}
                >
                  @{item.author.replace(" ", "").toLowerCase()}:
                </span>
                <p
                  className="font-body"
                  style={{
                    fontSize: "13px",
                    fontStyle: "italic",
                    color: "var(--color-ink-dim)",
                    margin: "4px 0 0",
                    lineHeight: "1.5",
                  }}
                >
                  &quot;{item.content}&quot;
                </p>
              </div>

              {/* Risk Preview and action */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  borderTop: "1px dashed var(--color-border)",
                  paddingTop: "10px",
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: "9px",
                    color: isCritical
                      ? "var(--color-error)"
                      : "var(--color-warn)",
                  }}
                >
                  {item.riskProfile}
                </span>

                <button
                  onClick={() =>
                    onLoadProposal(
                      item.content,
                      item.sourceType,
                      item.sourceDetail
                    )
                  }
                  className="cta-outlined btn-press"
                  style={{
                    fontSize: "11px",
                    padding: "6px 12px",
                  }}
                >
                  load into pre-mortem \u2197
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
