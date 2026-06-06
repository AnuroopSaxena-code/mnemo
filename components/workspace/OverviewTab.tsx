"use client";

import { motion } from "framer-motion";
import type { DecisionRecord } from "@/lib/types";
import { scoreDecisionHealth } from "@/lib/health";

interface OverviewTabProps {
  activeRepo: string;
  decisions: DecisionRecord[];
  onTabSelect: (tab: string) => void;
}

export function OverviewTab({ activeRepo, decisions, onTabSelect }: OverviewTabProps) {
  const reversedCount = decisions.filter(
    (d) => scoreDecisionHealth(d).label === "Reversed"
  ).length;

  const staleCount = decisions.filter(
    (d) => scoreDecisionHealth(d).label === "Stale"
  ).length;

  return (
    <div
      style={{
        padding: "48px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
        minHeight: "100vh",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "24px",
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: "10px",
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          Active Workspace
        </span>
        <h1
          className="font-heading"
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            color: "var(--color-ink)",
            margin: 0,
            fontWeight: 400,
          }}
        >
          {activeRepo}
        </h1>
        <p
          className="font-mono"
          style={{
            fontSize: "clamp(12px, 1.4vw, 14px)",
            color: "var(--color-ink-muted)",
            margin: 0,
            maxWidth: "600px",
            lineHeight: 1.5,
          }}
        >
          Codebase memory is active and indexing decisions. Use the modules below
          to recall history, analyze pull requests, or generate onboarding material.
        </p>
      </motion.header>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "var(--color-surface-2)",
            padding: "20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span className="font-mono" style={{ fontSize: "10px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Total Decisions Retained</span>
          <span className="font-mono" style={{ fontSize: "24px", color: "var(--color-ink)" }}>{decisions.length}</span>
        </div>
        <div
          style={{
            background: "var(--color-surface-2)",
            padding: "20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span className="font-mono" style={{ fontSize: "10px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Reversed / Deprecated</span>
          <span className="font-mono" style={{ fontSize: "24px", color: "var(--color-error)" }}>{reversedCount}</span>
        </div>
        <div
          style={{
            background: "var(--color-surface-2)",
            padding: "20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span className="font-mono" style={{ fontSize: "10px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Stale Knowledge (Needs Review)</span>
          <span className="font-mono" style={{ fontSize: "24px", color: "var(--color-warn)" }}>{staleCount}</span>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        <button
          className="card-hover btn-press"
          onClick={() => onTabSelect("premortem")}
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "24px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            cursor: "pointer",
          }}
        >
          <h3 className="font-mono" style={{ fontSize: "14px", color: "var(--color-accent)", margin: 0 }}>
            01 Pre-Mortem Agent
          </h3>
          <p className="font-body" style={{ fontSize: "14px", color: "var(--color-ink-dim)", margin: 0, lineHeight: 1.5 }}>
            Paste proposed PRs or Architecture docs to flag historical gotchas and verify safety before merging.
          </p>
        </button>

        <button
          className="card-hover btn-press"
          onClick={() => onTabSelect("ask")}
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "24px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            cursor: "pointer",
          }}
        >
          <h3 className="font-mono" style={{ fontSize: "14px", color: "var(--color-accent)", margin: 0 }}>
            02 Ask Memory
          </h3>
          <p className="font-body" style={{ fontSize: "14px", color: "var(--color-ink-dim)", margin: 0, lineHeight: 1.5 }}>
            Chat directly with your codebase&apos;s retained memory index. Perfect for tracing back the &quot;why&quot; behind old decisions.
          </p>
        </button>

        <button
          className="card-hover btn-press"
          onClick={() => onTabSelect("timeline")}
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "24px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            cursor: "pointer",
          }}
        >
          <h3 className="font-mono" style={{ fontSize: "14px", color: "var(--color-accent)", margin: 0 }}>
            03 Decision Timeline
          </h3>
          <p className="font-body" style={{ fontSize: "14px", color: "var(--color-ink-dim)", margin: 0, lineHeight: 1.5 }}>
            Audit the structural lifecycle of architectural decisions, monitoring health decay and reversals over time.
          </p>
        </button>

        <button
          className="card-hover btn-press"
          onClick={() => onTabSelect("onboarding")}
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "24px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            cursor: "pointer",
          }}
        >
          <h3 className="font-mono" style={{ fontSize: "14px", color: "var(--color-accent)", margin: 0 }}>
            04 Onboarding Brief
          </h3>
          <p className="font-body" style={{ fontSize: "14px", color: "var(--color-ink-dim)", margin: 0, lineHeight: 1.5 }}>
            Generate instant contextual briefs for new engineers joining specific services or domains in the monorepo.
          </p>
        </button>
      </motion.div>
    </div>
  );
}
