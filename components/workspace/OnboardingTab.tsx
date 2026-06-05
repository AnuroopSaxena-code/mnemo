"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DecisionRecord, OnboardingBrief } from "@/lib/types";

interface OnboardingTabProps {
  onDecisionClick: (decision: DecisionRecord) => void;
  decisions: DecisionRecord[];
  showcaseMode?: boolean;
}

const SERVICE_OPTIONS = [
  { id: "billing-events", label: "Billing Event pipeline (billing-events)" },
  { id: "auth", label: "Dashboard Authentication (auth)" },
  { id: "analytics", label: "Analytics & Event Engine (analytics)" },
  { id: "ci-cd", label: "CI/CD & Deploy Pipelines (ci-cd)" },
  { id: "sdk", label: "TypeScript client SDK (sdk)" },
  { id: "integrations", label: "Outbound Integrations (integrations)" },
];

export function OnboardingTab({
  onDecisionClick,
  decisions,
  showcaseMode,
}: OnboardingTabProps) {
  const [selectedService, setSelectedService] = useState("billing-events");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<OnboardingBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrief() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: selectedService, bankId: showcaseMode ? "mnemo" : undefined }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to load onboarding brief");
        setBrief(data as OnboardingBrief);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    loadBrief();
  }, [selectedService, showcaseMode]);

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
      {/* Header and selector */}
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
              fontSize: "18px",
              color: "var(--color-ink)",
              fontWeight: 400,
              margin: "0 0 4px",
            }}
          >
            New Engineer Onboarding Briefs
          </h2>
          <p
            className="font-mono"
            style={{
              fontSize: "11px",
              color: "var(--color-ink-muted)",
              margin: 0,
            }}
          >
            Generate the critical decisions that affect your first sprint.
          </p>
        </div>

        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "8px 12px",
            color: "var(--color-ink)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </header>

      {/* Brief Content */}
      <div style={{ flex: 1 }}>
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
                gap: "8px",
                paddingTop: "20px",
              }}
            >
              <div className="amber-loader" style={{ width: "100px" }}>
                <span
                  className="font-mono blink-cursor"
                  style={{
                    fontSize: "13px",
                    color: "var(--color-accent)",
                  }}
                >
                  compiling...
                </span>
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
                paddingTop: "20px",
              }}
            >
              {error}
            </motion.div>
          ) : brief ? (
            <motion.div
              key="brief"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* Summary intro card */}
              <div
                style={{
                  background: "var(--color-surface-2)",
                  borderLeft: "2px solid var(--color-accent)",
                  borderRadius: "var(--radius)",
                  padding: "20px",
                }}
              >
                <h3
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    color: "var(--color-accent)",
                    textTransform: "uppercase",
                    margin: "0 0 6px",
                    letterSpacing: "0.08em",
                  }}
                >
                  scope summary: {brief.service}
                </h3>
                <p
                  className="font-body"
                  style={{
                    fontSize: "15px",
                    fontStyle: "italic",
                    color: "var(--color-ink)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {brief.summary}
                </p>
              </div>

              {/* Decisions list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <h4
                  className="font-mono"
                  style={{
                    fontSize: "9px",
                    color: "var(--color-ink-muted)",
                    textTransform: "uppercase",
                    margin: 0,
                    letterSpacing: "0.08em",
                  }}
                >
                  must-know context ({brief.decisions.length} decisions)
                </h4>

                {brief.decisions.map((decItem, idx) => {
                  const matchedRecord = decisions.find(
                    (d) =>
                      d.title
                        .toLowerCase()
                        .includes(decItem.title.toLowerCase()) ||
                      decItem.title
                        .toLowerCase()
                        .includes(d.title.toLowerCase())
                  );

                  const statusColor =
                    decItem.health.label === "Reversed"
                      ? "var(--color-error)"
                      : decItem.health.label === "Stale"
                      ? "var(--color-warn)"
                      : "var(--color-green)";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.3 }}
                      style={{
                        background: "var(--color-surface-1)",
                        borderLeft: `2px solid ${statusColor}`,
                        borderRadius: "var(--radius)",
                        padding: "16px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <h5
                          className="font-mono"
                          style={{
                            fontSize: "13px",
                            color: "var(--color-ink)",
                            margin: 0,
                            fontWeight: "bold",
                          }}
                        >
                          {idx + 1}. {decItem.title}
                        </h5>

                        <span
                          className="font-mono"
                          style={{
                            fontSize: "9px",
                            color: statusColor,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {decItem.health.label}
                        </span>
                      </div>

                      <p
                        className="font-body"
                        style={{
                          fontSize: "14px",
                          fontStyle: "italic",
                          color: "var(--color-ink-dim)",
                          lineHeight: "1.5",
                          margin: "0 0 12px",
                        }}
                      >
                        {decItem.whyItMatters}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop:
                            "1px dashed var(--color-border)",
                          paddingTop: "8px",
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "10px",
                            color: "var(--color-ink-muted)",
                          }}
                        >
                          {decItem.source}
                        </span>

                        {matchedRecord && (
                          <button
                            onClick={() =>
                              onDecisionClick(matchedRecord)
                            }
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
                            see timeline \u2192
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
