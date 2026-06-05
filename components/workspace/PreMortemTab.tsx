"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DecisionRecord, PremortemResult, SourceType, OperationBadge } from "@/lib/types";


interface PreMortemTabProps {
  onDecisionClick: (decision: DecisionRecord) => void;
  onAddDecision: (newDec: DecisionRecord) => void;
  initialProposal?: string;
  initialSourceType?: SourceType;
  initialSourceDetail?: string;
  showcaseMode?: boolean;
}

export function PreMortemTab({
  onDecisionClick,
  onAddDecision,
  initialProposal,
  initialSourceType,
  initialSourceDetail,
  showcaseMode,
}: PreMortemTabProps) {
  const [proposal, setProposal] = useState(initialProposal || "");
  const [sourceType, setSourceType] = useState<SourceType>(
    initialSourceType || "github"
  );
  const [sourceDetail, setSourceDetail] = useState(
    initialSourceDetail || "PR #1142 billing-orders"
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PremortemResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retaining, setRetaining] = useState(false);
  const [retainedMsg, setRetainedMsg] = useState<string | null>(null);

  // Operational badges tracking
  const [opBadges, setOpBadges] = useState<OperationBadge[]>([
    { label: "Recall before retain", state: "skipped", detail: "Waiting for proposal analysis." },
    { label: "Groq pre-mortem", state: "skipped", detail: "Waiting for proposal analysis." },
    { label: "Retained to Hindsight", state: "skipped", detail: "Pending manual retention approval." },
    { label: "Linked as revisit", state: "skipped", detail: "Pending relationship indexing." },
  ]);

  async function handleAnalyze() {
    if (!proposal.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRetainedMsg(null);

    setOpBadges([
      { label: "Recall before retain", state: "skipped", detail: "Recalling..." },
      { label: "Groq pre-mortem", state: "skipped", detail: "Synthesizing..." },
      { label: "Retained to Hindsight", state: "skipped", detail: "Pending." },
      { label: "Linked as revisit", state: "skipped", detail: "Pending." },
    ]);

    try {
      const res = await fetch("/api/memory/premortem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: proposal, source: sourceType, sourceName: sourceDetail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze proposal");

      setResult(data as PremortemResult);

      const apiBadges = data.operations as OperationBadge[];
      setOpBadges([
        apiBadges.find((b) => b.label.toLowerCase().includes("recall")) || {
          label: "Recall before retain",
          state: "complete",
          detail: "Recalled similar historical records.",
        },
        apiBadges.find((b) => b.label.toLowerCase().includes("groq")) || {
          label: "Groq pre-mortem",
          state: "complete",
          detail: "Structured pre-mortem generated.",
        },
        { label: "Retained to Hindsight", state: "skipped", detail: "Pending retention confirmation." },
        { label: "Linked as revisit", state: "skipped", detail: "Pending retention confirmation." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setOpBadges((prev) =>
        prev.map((b) =>
          b.label.includes("pre-mortem")
            ? { ...b, state: "error", detail: "Failed to generate." }
            : b
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRetain() {
    if (!proposal.trim() || retaining) return;
    setRetaining(true);
    setRetainedMsg(null);
    try {
      const res = await fetch("/api/memory/retain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: proposal, source: sourceType, repoFullName: sourceDetail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retain");

      const newDec = data.record as DecisionRecord;
      onAddDecision(newDec);

      const isRevisit = newDec.state === "revisited" || newDec.state === "reversed";
      setOpBadges((prev) =>
        prev.map((b) => {
          if (b.label.includes("Retained")) {
            return {
              label: b.label,
              state: "complete",
              detail: `Record ${newDec.id} committed to memory.`,
            };
          }
          if (b.label.includes("Linked")) {
            return {
              label: b.label,
              state: "complete",
              detail: isRevisit
                ? `Linked to historical precedent in '${newDec.scope}'.`
                : "No matching prior reversal — saved as fresh thread.",
            };
          }
          return b;
        })
      );

      setRetainedMsg(`Decision retained: ${newDec.title}`);
    } catch (err) {
      setRetainedMsg(
        err instanceof Error ? err.message : "Retention failed"
      );
    } finally {
      setRetaining(false);
    }
  }

  const warningColor = (level: string) => {
    if (level === "critical") return "var(--color-error)";
    if (level === "high") return "var(--color-warn)";
    return "var(--color-ink-muted)";
  };

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
      {/* 3-Column Layout Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ flex: 1 }}>
        {/* ── Left Column: Proposed PR/ADR Text Input ── */}
        <section
          className="lg:col-span-4 flex flex-col gap-4"
          style={{
            borderRight: "1px solid var(--color-border)",
            paddingRight: "24px",
          }}
        >
          <header>
            <h3
              className="font-mono"
              style={{
                fontSize: "10px",
                color: "var(--color-accent)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "4px",
              }}
            >
              01
            </h3>
            <h2
              className="font-heading"
              style={{
                fontSize: "16px",
                color: "var(--color-ink)",
                fontWeight: 400,
                margin: "0 0 4px",
              }}
            >
              Paste Incoming Changes
            </h2>
            <p
              className="font-mono"
              style={{
                fontSize: "11px",
                color: "var(--color-ink-muted)",
                lineHeight: "1.4",
                marginBottom: "16px",
              }}
            >
              PR descriptions, chat thread transcripts, or ADR drafts.
            </p>
          </header>

          <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <label
                className="font-mono"
                style={{
                  fontSize: "9px",
                  color: "var(--color-ink-muted)",
                  display: "block",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                source system
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                style={{
                  width: "100%",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "6px 8px",
                  borderRadius: "var(--radius)",
                }}
              >
                <option value="github">GitHub PR</option>
                <option value="discord">Discord Chat</option>
                <option value="whatsapp">WhatsApp Thread</option>
                <option value="slack">Slack Channel</option>
                <option value="adr">ADR Document</option>
                <option value="manual">Manual Entry</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                className="font-mono"
                style={{
                  fontSize: "9px",
                  color: "var(--color-ink-muted)",
                  display: "block",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                source name
              </label>
              <input
                type="text"
                value={sourceDetail}
                onChange={(e) => setSourceDetail(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "6px 8px",
                  borderRadius: "var(--radius)",
                }}
              />
            </div>
          </div>

          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            placeholder="Let's build a new service in node.js and run it on AWS..."
            style={{
              width: "100%",
              height: "260px",
              fontSize: "13px",
              padding: "12px",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.6",
              resize: "none",
              transition: "border-color 150ms ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="cta-amber btn-press"
          >
            {loading ? "CHECKING INSTINCTS..." : "RUN PRE-MERGE ANALYSIS"}
          </button>
        </section>

        {/* ── Center Column: Pre-Mortem Result & Warning Level ── */}
        <section
          className="lg:col-span-5 flex flex-col gap-4"
          style={{
            padding: "0 12px",
            borderRight: "1px solid var(--color-border)",
            paddingRight: "24px",
          }}
        >
          <header>
            <h3
              className="font-mono"
              style={{
                fontSize: "10px",
                color: "var(--color-accent)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "4px",
              }}
            >
              02
            </h3>
            <h2
              className="font-heading"
              style={{
                fontSize: "16px",
                color: "var(--color-ink)",
                fontWeight: 400,
                margin: 0,
              }}
            >
              Engineering Pre-Mortem
            </h2>
          </header>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  gap: "12px",
                }}
              >
                <div
                  className="amber-loader"
                  style={{ width: "100%", maxWidth: "160px" }}
                >
                  <div
                    className="font-mono blink-cursor"
                    style={{
                      fontSize: "12px",
                      color: "var(--color-accent)",
                      textAlign: "center",
                    }}
                  >
                    scanning memory...
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  color: "var(--color-error)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "16px",
                }}
              >
                Failed to scan codebase context: {error}
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                {/* Warning Level Alert */}
                <div
                  style={{
                    borderLeft: `2px solid ${warningColor(result.warningLevel)}`,
                    background: result.warningLevel === "critical"
                      ? "rgba(248, 81, 73, 0.06)"
                      : "var(--color-surface-2)",
                    padding: "16px",
                    borderRadius: "var(--radius)",
                    position: "relative",
                  }}
                  className={
                    result.warningLevel === "critical" ? "deja-vu-pulse" : ""
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "10px",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: warningColor(result.warningLevel),
                        color: result.warningLevel === "critical" ? "#fff" : "var(--color-bg)",
                        fontWeight: 600,
                      }}
                    >
                      {result.warningLevel} warning
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "10px",
                        color: "var(--color-ink-muted)",
                      }}
                    >
                      d\u00e9j\u00e0 vu detector active
                    </span>
                  </div>
                  <h4
                    className="font-mono"
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "var(--color-ink)",
                      margin: "0 0 6px",
                    }}
                  >
                    {result.headline}
                  </h4>
                  <p
                    className="font-body"
                    style={{
                      fontSize: "14px",
                      fontStyle: "italic",
                      color: "var(--color-ink-dim)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {result.summary}
                  </p>
                </div>

                {/* Failure Modes */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <p
                    className="font-mono"
                    style={{
                      fontSize: "9px",
                      color: "var(--color-ink-muted)",
                      margin: "0",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    potential failure modes
                  </p>

                  {result.failureModes.map((mode, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      style={{
                        padding: "12px",
                        background: "var(--color-surface-1)",
                        borderLeft: "2px solid var(--color-accent)",
                        borderRadius: "var(--radius)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <h5
                          className="font-mono"
                          style={{
                            fontSize: "12px",
                            color: "var(--color-accent)",
                            margin: 0,
                            fontWeight: "bold",
                          }}
                        >
                          {mode.risk}
                        </h5>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {mode.citations.map((cite) => (
                            <span
                              key={cite}
                              className="font-mono"
                              style={{
                                fontSize: "9px",
                                color: "var(--color-ink-muted)",
                                padding: "1px 4px",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-surface-2)",
                              }}
                            >
                              {cite}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: "12px",
                          fontStyle: "italic",
                          color: "var(--color-ink-dim)",
                          margin: "0 0 8px",
                          lineHeight: "1.4",
                        }}
                      >
                        {mode.whyHistorySuggestsIt}
                      </p>
                      <div
                        style={{
                          borderTop: "1px dashed var(--color-border)",
                          paddingTop: "6px",
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "9px",
                            color: "var(--color-green)",
                            textTransform: "uppercase",
                          }}
                        >
                          MITIGATION:{" "}
                        </span>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "11px",
                            color: "var(--color-ink)",
                          }}
                        >
                          {mode.mitigation}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius)",
                  height: "300px",
                }}
              >
                <p
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    color: "var(--color-ink-muted)",
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  Awaiting analysis. Paste code change proposals on the left and
                  click &quot;Run Pre-Merge Analysis&quot;.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Right Column: Recalled Evidence & Health Scores ── */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <header>
            <h3
              className="font-mono"
              style={{
                fontSize: "10px",
                color: "var(--color-accent)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "4px",
              }}
            >
              03
            </h3>
            <h2
              className="font-heading"
              style={{
                fontSize: "16px",
                color: "var(--color-ink)",
                fontWeight: 400,
                margin: 0,
              }}
            >
              Recalled Evidence
            </h2>
          </header>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              overflowY: "auto",
              maxHeight: "450px",
            }}
          >
            {result && result.evidence && result.evidence.length > 0 ? (
              result.evidence.map((memory) => {
                const rec = memory.record;
                if (!rec) return null;
                const statusColor =
                  rec.state === "reversed"
                    ? "var(--color-error)"
                    : rec.state === "stale"
                    ? "var(--color-warn)"
                    : rec.state === "reinforced"
                    ? "var(--color-green)"
                    : "var(--color-accent)";

                return (
                  <button
                    key={memory.id}
                    onClick={() => onDecisionClick(rec)}
                    className="card-hover btn-press"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px",
                      background: "var(--color-surface-2)",
                      border: "none",
                      borderLeft: `2px solid ${statusColor}`,
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 150ms ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--color-accent)",
                        }}
                      >
                        {rec.id}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "9px",
                          color: statusColor,
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {rec.state}
                      </span>
                    </div>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: "12px",
                        color: "var(--color-ink)",
                        margin: "0 0 6px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rec.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "9px",
                          color: "var(--color-ink-muted)",
                        }}
                      >
                        {rec.date} \u00b7 {rec.scope}
                      </span>
                      {memory.health && (
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "9px",
                            color: "var(--color-ink-dim)",
                          }}
                        >
                          {memory.health.score}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p
                className="font-mono"
                style={{
                  fontSize: "11px",
                  color: "var(--color-ink-muted)",
                  textAlign: "center",
                  paddingTop: "40px",
                }}
              >
                No active recall context loaded.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ── Retain Action & Pipeline Trail ── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h4
              className="font-mono"
              style={{
                fontSize: "12px",
                color: "var(--color-ink)",
                margin: "0 0 4px",
                fontWeight: 600,
              }}
            >
              Commit to Codebase Memory
            </h4>
            <p
              className="font-mono"
              style={{
                fontSize: "11px",
                color: "var(--color-ink-muted)",
                margin: 0,
              }}
            >
              Retaining indexes this decision into Hindsight. Re-scanning will
              link future conflicts.
            </p>
          </div>

          <button
            onClick={handleRetain}
            disabled={!result || retaining}
            className="cta-outlined btn-press"
            style={{
              opacity: result ? 1 : 0.3,
              cursor: result ? "pointer" : "not-allowed",
            }}
          >
            {retaining ? "RETAINING..." : "RETAIN THIS DECISION"}
          </button>
        </div>

        {/* Inline retain status — no toast */}
        {retainedMsg && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono"
            style={{
              fontSize: "11px",
              color: "var(--color-accent)",
              margin: 0,
            }}
          >
            {retainedMsg}
          </motion.p>
        )}

        {/* Pipeline Trail Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {opBadges.map((badge, idx) => {
            const isCompleted = badge.state === "complete";
            const isWarning = badge.state === "warning";
            const isError = badge.state === "error";
            const dotColor = isCompleted
              ? "var(--color-green)"
              : isWarning
              ? "var(--color-warn)"
              : isError
              ? "var(--color-error)"
              : "var(--color-ink-muted)";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: isCompleted || isError ? 1 : 0.4 }}
                transition={{ delay: isCompleted ? idx * 0.2 : 0, duration: 0.3 }}
                className={`pipeline-badge ${isCompleted ? "pipeline-badge-active" : ""}`}
                style={{
                  flex: "1 1 200px",
                  background: "var(--color-surface-2)",
                  borderLeft: `2px solid ${isCompleted ? "var(--color-green)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius)",
                  padding: "10px 12px",
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
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: isCompleted ? "var(--color-ink)" : "var(--color-ink-muted)",
                      fontWeight: isCompleted ? 600 : 400,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "9px",
                    color: "var(--color-ink-muted)",
                    lineHeight: "1.3",
                    paddingLeft: "11px",
                  }}
                >
                  {badge.detail}
                </span>
              </motion.div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
