"use client";

import { useState } from "react";
import type { DecisionRecord } from "@/lib/types";
import { scoreDecisionHealth } from "@/lib/health";

interface TimelineTabProps {
  decisions: DecisionRecord[];
  onDecisionClick: (decision: DecisionRecord) => void;
  activeRepo?: string;
}

export function TimelineTab({ decisions, onDecisionClick, activeRepo }: TimelineTabProps) {
  const [search, setSearch] = useState("");
  const [inferredDecisions, setInferredDecisions] = useState<DecisionRecord[]>([]);
  const [isInferring, setIsInferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDecisions = [...decisions, ...inferredDecisions];

  const filtered = allDecisions.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.scope.toLowerCase().includes(q) ||
      d.decision.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  async function handleInferTimeline() {
    setIsInferring(true);
    setError(null);
    try {
      const res = await fetch('/api/decisions/infer', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName: activeRepo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to infer timeline");
      setInferredDecisions(data.inferred || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating timeline");
    } finally {
      setIsInferring(false);
    }
  }

  return (
    <div
      style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minHeight: "100vh",
      }}
    >
      {/* Header and Search */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "16px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(18px, 2.5vw, 24px)",
              color: "var(--color-ink)",
              fontWeight: 400,
              margin: "0 0 4px",
            }}
          >
            Decision Lifecycle Timeline
          </h2>
          <p
            className="font-mono"
            style={{
              fontSize: "clamp(11px, 1.2vw, 13px)",
              color: "var(--color-ink-muted)",
              margin: 0,
            }}
          >
            Audit history, reversals, and confidence health decay tracking.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {decisions.length === 0 && inferredDecisions.length === 0 && (
            <button 
              onClick={handleInferTimeline}
              disabled={isInferring}
              className="cta-amber btn-press"
              style={{ padding: "8px 16px", fontSize: "12px", height: "fit-content" }}
            >
              {isInferring ? "Inferring from codebase..." : "Generate Timeline from Codebase"}
            </button>
          )}

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by keyword, service, or tag..."
            className="input-minimal"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
              color: "var(--color-ink)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              width: "100%",
              maxWidth: "250px",
            }}
          />
        </div>
      </header>

      {error && (
        <div style={{ padding: "12px", background: "var(--color-surface-1)", borderLeft: "2px solid var(--color-error)", color: "var(--color-error)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
          {error}
        </div>
      )}

      {/* Decisions timeline list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filtered.length > 0 ? (
          filtered.map((dec) => {
            const health = scoreDecisionHealth(dec);

            const statusColor =
              health.label === "Reversed"
                ? "var(--color-error)"
                : health.label === "Stale"
                ? "var(--color-warn)"
                : health.label === "Watch"
                ? "var(--color-accent)"
                : "var(--color-green)";

            return (
              <div
                key={dec.id}
                style={{
                  background: "var(--color-surface-1)",
                  borderLeft: `2px solid ${statusColor}`,
                  borderRadius: "var(--radius)",
                  padding: "20px",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Top Info */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "11px",
                          color: "var(--color-accent)",
                          fontWeight: "bold",
                        }}
                      >
                        {dec.id}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--color-ink-muted)",
                        }}
                      >
                        via {dec.source}
                      </span>
                      {(dec as any).inferred && (
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "9px",
                            color: "var(--color-accent)",
                            background: "rgba(224, 130, 49, 0.1)",
                            padding: "2px 6px",
                            borderRadius: "var(--radius-sm)",
                            textTransform: "uppercase"
                          }}
                        >
                          AI Generated
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-mono"
                      style={{
                        fontSize: "clamp(14px, 1.8vw, 16px)",
                        color: "var(--color-ink)",
                        margin: 0,
                        fontWeight: 400,
                      }}
                    >
                      {dec.title}
                    </h3>
                  </div>

                  {/* Health Indicator */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: "11px",
                          color: "var(--color-ink)",
                        }}
                      >
                        {health.score}%
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: "9px",
                          color: statusColor,
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                      >
                        {health.label}
                      </div>
                    </div>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: statusColor,
                      }}
                    />
                  </div>
                </div>

                {/* Decision Text */}
                <p
                  className="font-body"
                  style={{
                    fontSize: "clamp(13px, 1.5vw, 15px)",
                    color: "var(--color-ink-dim)",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  {dec.decision}
                </p>

                {/* Horizontal Lifecycle */}
                <div
                  style={{
                    margin: "4px 0",
                    background: "var(--color-surface-2)",
                    borderRadius: "var(--radius)",
                    padding: "12px",
                  }}
                >
                  <p
                    className="font-mono"
                    style={{
                      fontSize: "9px",
                      color: "var(--color-ink-muted)",
                      textTransform: "uppercase",
                      margin: "0 0 10px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    lifecycle
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      overflowX: "auto",
                      gap: "12px",
                      paddingBottom: "4px",
                    }}
                  >
                    {dec.lifecycle.map((evt, idx) => {
                      const isLast = idx === dec.lifecycle.length - 1;
                      const stepColor =
                        evt.state === "reversed"
                          ? "var(--color-error)"
                          : evt.state === "stale"
                          ? "var(--color-warn)"
                          : evt.state === "reinforced"
                          ? "var(--color-green)"
                          : "var(--color-accent)";

                      return (
                        <div
                          key={evt.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: stepColor,
                                }}
                              />
                              <span
                                className="font-mono"
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-ink)",
                                  fontWeight: "bold",
                                }}
                              >
                                {evt.title}
                              </span>
                            </div>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: "9px",
                                color: "var(--color-ink-muted)",
                              }}
                            >
                              {evt.date} \u00b7 {evt.source}
                            </span>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: "clamp(10px, 1.2vw, 12px)",
                                color: "var(--color-ink-dim)",
                                maxWidth: "160px",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {evt.summary}
                            </span>
                          </div>

                          {!isLast && (
                            <span
                              className="font-mono"
                              style={{
                                margin: "0 12px",
                                color: "var(--color-border-hover)",
                                fontSize: "14px",
                                userSelect: "none",
                              }}
                            >
                              \u27f6
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tags and Inspect */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "8px",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                  >
                    {dec.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono"
                        style={{
                          fontSize: "9px",
                          color: "var(--color-ink-muted)",
                          background: "var(--color-surface-2)",
                          borderRadius: "var(--radius-sm)",
                          padding: "2px 6px",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onDecisionClick(dec)}
                    className="font-mono btn-press"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-accent)",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    inspect full details \u2192
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p
            className="font-mono"
            style={{
              fontSize: "clamp(12px, 1.4vw, 14px)",
              color: "var(--color-ink-muted)",
              padding: "40px",
              textAlign: "center",
            }}
          >
            No decisions exist. {decisions.length === 0 && !isInferring && "Click Generate Timeline to analyze your codebase architecture."}
          </p>
        )}
      </div>
    </div>
  );
}
