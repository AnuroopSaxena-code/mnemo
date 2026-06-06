"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { DecisionRecord } from "@/lib/types";

interface DecisionDetailScreenProps {
  decision: DecisionRecord;
  onBack: () => void;
}

const stateColors: Record<string, string> = {
  decided: "var(--color-accent)",
  proposed: "var(--color-ink-muted)",
  reinforced: "var(--color-green)",
  revisited: "var(--color-warn)",
  reversed: "var(--color-error)",
  stale: "var(--color-warn)",
};

export function DecisionDetailScreen({
  decision,
  onBack,
}: DecisionDetailScreenProps) {
  const [status, setStatus] = useState(decision.state);
  const [reversalReason, setReversalReason] = useState((decision as any).reversalReason || "");
  const [showReversalForm, setShowReversalForm] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInferred = decision.id.startsWith("inf_");

  async function handleUpdateStatus(newStatus: string, reasonText?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/decisions/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: decision.id,
          status: newStatus,
          reversalReason: reasonText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      
      setStatus(newStatus as any);
      if (reasonText) setReversalReason(reasonText);
      setShowReversalForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to update decision status");
    } finally {
      setLoading(false);
    }
  }

  const timelineStates = decision.lifecycle?.length
    ? decision.lifecycle.map(l => ({ ...l, state: l.id === `evt_${decision.id}` ? status : l.state }))
    : [
        {
          id: "init",
          state: status,
          date: decision.date,
          title: decision.title,
          summary: "",
          source: decision.source,
        },
      ];

  return (
    <motion.section
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "var(--color-bg)",
        overflowY: "auto",
        padding: "48px 32px 64px",
      }}
      initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Back nav */}
        <nav style={{ marginBottom: 40 }}>
          <button
            className="font-mono btn-press"
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-ink-muted)",
              fontSize: "clamp(13px, 1.5vw, 15px)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {"\u2190"} mnemo
          </button>
        </nav>

        {/* Title */}
        <h1
          className="font-heading"
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            color: "var(--color-ink)",
            fontWeight: 400,
            margin: "0 0 12px 0",
            lineHeight: 1.3,
          }}
        >
          {decision.title}
        </h1>

        {/* Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <span
            className="font-mono"
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: stateColors[status] || "var(--color-surface-2)",
              color: status === "reversed" ? "#fff" : "var(--color-bg)",
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {status}
          </span>
          <span className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-muted)" }}>
            Scope: {decision.scope || "global"}
          </span>
        </div>

        {/* Reversal Reason */}
        {status === "reversed" && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid var(--color-error)",
              borderRadius: "var(--radius)",
              padding: "20px",
              marginBottom: 32,
            }}
          >
            <h4
              className="font-mono"
              style={{
                fontSize: "11px",
                color: "var(--color-error)",
                textTransform: "uppercase",
                margin: "0 0 8px",
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              Reversal Precedent
            </h4>
            <p
              className="font-body"
              style={{ fontSize: "14px", color: "var(--color-ink-dim)", margin: 0, lineHeight: 1.6 }}
            >
              {reversalReason || "No reversal reason recorded."}
            </p>
          </div>
        )}

        {/* Timeline arc */}
        {timelineStates.length > 0 && (
          <figure
            aria-label="Decision timeline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              marginBottom: 40,
              padding: "16px 0",
            }}
          >
            {timelineStates.map((event, i) => (
              <div
                key={event.id}
                className="flex items-center"
                style={{ gap: 0 }}
              >
                {/* Dot */}
                <div
                  className="flex flex-col items-center"
                  style={{ gap: 6 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background:
                        stateColors[event.state] || "var(--color-ink-muted)",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "clamp(10px, 1.1vw, 12px)",
                      color:
                        stateColors[event.state] || "var(--color-ink-muted)",
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.state}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "clamp(9px, 1vw, 11px)",
                      color: "var(--color-ink-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.date}
                  </span>
                </div>
                {/* Connecting line */}
                {i < timelineStates.length - 1 && (
                  <div
                    style={{
                      width: 48,
                      height: 1,
                      background: "var(--color-border-hover)",
                      margin: "0 8px",
                      alignSelf: "flex-start",
                      marginTop: 5,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </figure>
        )}

        {/* Rationale */}
        <article style={{ marginBottom: 32, wordBreak: "break-word", overflowWrap: "anywhere" }}>
          <p
            className="font-body"
            style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              fontStyle: "italic",
              color: "var(--color-ink)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {decision.rationale}
          </p>
        </article>

        {/* Alternatives rejected */}
        {decision.alternatives?.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2
              className="font-mono"
              style={{
                fontSize: "clamp(10px, 1.1vw, 12px)",
                color: "var(--color-ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              alternatives rejected
            </h2>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {decision.alternatives.map((alt) => (
                <li
                  key={alt.name}
                  className="font-mono"
                  style={{
                    fontSize: "clamp(13px, 1.5vw, 15px)",
                    color: "var(--color-ink-dim)",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-ink-muted)",
                      marginRight: 8,
                    }}
                  >
                    {"\u00d7"}
                  </span>
                  <span style={{ color: "var(--color-ink)" }}>
                    {alt.name}
                  </span>
                  <span style={{ marginLeft: 8 }}>
                    {"\u2014"} {alt.rejectedBecause}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Caveats */}
        {decision.caveats?.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {decision.caveats.map((caveat) => (
                <li
                  key={caveat}
                  className="font-mono"
                  style={{
                    fontSize: "clamp(13px, 1.5vw, 15px)",
                    color: "var(--color-accent)",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  <span style={{ marginRight: 8 }}>{"\u2691"}</span>
                  {caveat}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Status Management (only for non-inferred database decisions) */}
        {!isInferred && (
          <section
            style={{
              borderTop: "1px solid var(--color-border)",
              paddingTop: 24,
              marginTop: 40,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h3
              className="font-mono"
              style={{
                fontSize: "10px",
                color: "var(--color-ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: 0,
              }}
            >
              Manage Decision Status (alerts discord)
            </h3>
            
            {error && (
              <p className="font-mono" style={{ fontSize: "12px", color: "var(--color-error)", margin: 0 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {status !== "reversed" && (
                <button
                  className="font-mono btn-press"
                  disabled={loading}
                  onClick={() => setShowReversalForm(true)}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid var(--color-error)",
                    color: "var(--color-error)",
                    fontSize: "11px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Reverse Decision
                </button>
              )}
              {status !== "stale" && (
                <button
                  className="font-mono btn-press"
                  disabled={loading}
                  onClick={() => handleUpdateStatus("stale")}
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid var(--color-warn)",
                    color: "var(--color-warn)",
                    fontSize: "11px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Mark Stale
                </button>
              )}
              {status !== "decided" && (status as string) !== "standing" && (
                <button
                  className="font-mono btn-press"
                  disabled={loading}
                  onClick={() => handleUpdateStatus("decided")}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-accent)",
                    color: "var(--color-accent)",
                    fontSize: "11px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Mark Active
                </button>
              )}
            </div>

            {showReversalForm && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 8,
                  background: "var(--color-surface-1)",
                  padding: 16,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <label className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-dim)" }}>
                  Enter reversal reason:
                </label>
                <input
                  type="text"
                  className="font-mono"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Migration completed; replaced by federated gateway"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-ink)",
                    padding: "8px 12px",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="font-mono btn-press"
                    disabled={loading || !newReason.trim()}
                    onClick={() => handleUpdateStatus("reversed", newReason)}
                    style={{
                      background: "var(--color-error)",
                      border: "none",
                      color: "#fff",
                      fontSize: "11px",
                      padding: "6px 12px",
                      cursor: loading || !newReason.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    Confirm Reversal
                  </button>
                  <button
                    className="font-mono btn-press"
                    onClick={() => setShowReversalForm(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-ink-muted)",
                      fontSize: "11px",
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Source */}
        <footer
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: 24,
            marginTop: 40,
          }}
        >
          <div className="flex items-center" style={{ gap: 12 }}>
            {/* Author avatar */}
            {decision.people?.[0] && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius)",
                  background: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(12px, 1.4vw, 14px)",
                  color: "var(--color-bg)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {decision.people[0].charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              {decision.people?.[0] && (
                <p
                  className="font-mono"
                  style={{
                    fontSize: "clamp(12px, 1.4vw, 14px)",
                    color: "var(--color-ink-dim)",
                    margin: 0,
                  }}
                >
                  {decision.people[0]}
                </p>
              )}
              <p
                className="font-mono"
                style={{
                  fontSize: "clamp(11px, 1.2vw, 13px)",
                  color: "var(--color-ink-muted)",
                  margin: "2px 0 0 0",
                }}
              >
                {decision.source}
                {decision.sourceUrl && (
                  <>
                    {" \u00b7 "}
                    <a
                      href={decision.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--color-accent)",
                        textDecoration: "none",
                        borderBottom: "1px solid transparent",
                        transition: "border-color 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor =
                          "var(--color-accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor =
                          "transparent";
                      }}
                    >
                      view source
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </motion.section>
  );
}
