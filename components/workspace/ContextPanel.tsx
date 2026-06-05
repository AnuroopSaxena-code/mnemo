"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DecisionRecord } from "@/lib/types";

interface ContextPanelProps {
  decisions: DecisionRecord[];
  onDecisionClick: (decision: DecisionRecord) => void;
}

export function ContextPanel({ decisions, onDecisionClick }: ContextPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        className="panel-tab"
        onClick={() => setCollapsed(false)}
        aria-label="Expand related memory panel"
        style={{ flexShrink: 0 }}
      />
    );
  }

  return (
    <motion.aside
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid var(--color-border)",
        padding: "24px 16px",
        overflowY: "auto",
        height: "100vh",
        position: "sticky",
        top: 0
      }}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <header className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h2
          className="font-mono"
          style={{
            fontSize: 10,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            margin: 0,
            fontWeight: 600
          }}
        >
          related memory
        </h2>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse panel"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-ink-muted)",
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "var(--font-mono)",
            padding: "4px 8px"
          }}
        >
          ✕
        </button>
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {decisions.slice(0, 10).map((decision) => (
          <li key={decision.id}>
            <button
              className="card-hover sidebar-card-hover btn-press"
              onClick={() => onDecisionClick(decision)}
              style={{
                display: "block",
                width: "100%",
                padding: "12px",
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <p
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: "var(--color-ink)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {decision.title}
              </p>
              <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: decision.state === "reversed"
                      ? "#f85149"
                      : decision.state === "stale"
                        ? "#d29922"
                        : "var(--color-green)",
                    flexShrink: 0
                  }}
                  aria-hidden="true"
                />
                <span
                  className="font-mono"
                  style={{ fontSize: 10, color: "var(--color-ink-muted)" }}
                >
                  {decision.date}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </motion.aside>
  );
}

/* Inline link for mobile, shown below answers */
export function RelatedMemoryLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="font-mono btn-press"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--color-ink-muted)",
        fontSize: 11,
        cursor: "pointer",
        padding: "8px 0",
        marginTop: 16
      }}
    >
      related ↗
    </button>
  );
}
