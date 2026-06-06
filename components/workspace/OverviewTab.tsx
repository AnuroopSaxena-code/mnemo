"use client";

import { motion } from "framer-motion";
import type { DecisionRecord } from "@/lib/types";
import { scoreDecisionHealth } from "@/lib/health";

interface OverviewTabProps {
  activeRepo: string;
  decisions: DecisionRecord[];
  onTabSelect: (tab: string) => void;
}

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const QUICK_ACTIONS = [
  {
    id: "premortem",
    index: "01",
    title: "Pre-Mortem Agent",
    description:
      "Paste proposed PRs or Architecture docs to flag historical gotchas, reversals and safety risks before they ship.",
    icon: "◈",
  },
  {
    id: "ask",
    index: "02",
    title: "Ask Memory",
    description:
      "Chat with your codebase\u0027s retained memory index. Trace the \u0022why\u0022 behind any decision, instantly.",
    icon: "◉",
  },
  {
    id: "timeline",
    index: "03",
    title: "Decision Timeline",
    description:
      "Audit the structural lifecycle of architectural decisions, tracking health decay and reversals over time.",
    icon: "◎",
  },
  {
    id: "onboarding",
    index: "04",
    title: "Onboarding Brief",
    description:
      "Generate instant contextual briefs for new engineers joining specific services or domains in the monorepo.",
    icon: "◌",
  },
  {
    id: "socials",
    index: "06",
    title: "Connect Socials",
    description:
      "Bring Mnemo into Discord and Slack. Query memory, run pre-mortems, and receive stale decision alerts directly in your team\u0027s chat.",
    icon: "◈",
  },
];

const HOW_IT_WORKS = [
  { step: "01", label: "Connect", detail: "Link your GitHub repository. Mnemo begins reading your commit and PR history." },
  { step: "02", label: "Extract", detail: "Our AI identifies every architectural decision, caveat, and reversal in context." },
  { step: "03", label: "Retain", detail: "Decisions are indexed into a persistent memory graph — searchable and traceable." },
  { step: "04", label: "Warn", detail: "When history is about to repeat itself, Mnemo flags it before it ships." },
];

export function OverviewTab({ activeRepo, decisions, onTabSelect }: OverviewTabProps) {
  const reversedCount = decisions.filter(
    (d) => scoreDecisionHealth(d).label === "Reversed"
  ).length;

  const staleCount = decisions.filter(
    (d) => scoreDecisionHealth(d).label === "Stale"
  ).length;

  const healthyCount = decisions.length - reversedCount - staleCount;

  return (
    <div
      style={{
        padding: "48px 48px 80px",
        display: "flex",
        flexDirection: "column",
        gap: "56px",
        maxWidth: "1024px",
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <motion.header {...FADE_UP(0)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <span
          className="font-mono"
          style={{
            fontSize: "10px",
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          Active Workspace
        </span>
        <h1
          className="font-heading"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: "var(--color-ink)",
            margin: 0,
            fontWeight: 400,
            lineHeight: 1.1,
          }}
        >
          {activeRepo}
        </h1>
        <div style={{ height: 1, background: "linear-gradient(90deg, var(--color-accent), transparent)", maxWidth: 320, marginTop: 4 }} />
        <p
          className="font-mono"
          style={{
            fontSize: "13px",
            color: "var(--color-ink-muted)",
            margin: 0,
            maxWidth: "520px",
            lineHeight: 1.7,
            marginTop: 4,
          }}
        >
          Codebase memory is active. Every decision, reversal, and caveat is indexed and ready to surface when you need it.
        </p>
      </motion.header>

      {/* ── Stats ── */}
      <motion.section {...FADE_UP(0.1)} aria-label="Repository statistics">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            { label: "Total Decisions Retained", value: decisions.length, color: "var(--color-ink)", sub: "across all branches" },
            { label: "Healthy", value: healthyCount, color: "var(--color-green)", sub: "passing review" },
            { label: "Reversed / Deprecated", value: reversedCount, color: "var(--color-error)", sub: "no longer valid" },
            { label: "Stale — Needs Review", value: staleCount, color: "var(--color-warn)", sub: "may be outdated" },
          ].map(({ label, value, color, sub }) => (
            <div
              key={label}
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                padding: "24px 24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                {label}
              </span>
              <span className="font-mono" style={{ fontSize: "40px", color, lineHeight: 1, fontWeight: 400 }}>
                {value}
              </span>
              <span className="font-mono" style={{ fontSize: "10px", color: "var(--color-ink-ghost)", marginTop: 4 }}>
                {sub}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Quick Actions ── */}
      <motion.section {...FADE_UP(0.2)} aria-label="Quick actions">
        <h2
          className="font-mono"
          style={{ fontSize: "10px", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 16px" }}
        >
          Memory Modules
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {QUICK_ACTIONS.map(({ id, index, title, description, icon }) => (
            <button
              key={id}
              className="card-hover btn-press"
              onClick={() => onTabSelect(id)}
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                padding: "24px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  className="font-mono"
                  style={{ fontSize: "11px", color: "var(--color-accent)", letterSpacing: "0.1em" }}
                >
                  {index} {title}
                </span>
                <span style={{ fontSize: "18px", color: "var(--color-accent)", opacity: 0.4 }}>{icon}</span>
              </div>
              <p
                className="font-body"
                style={{ fontSize: "13px", color: "var(--color-ink-dim)", margin: 0, lineHeight: 1.65 }}
              >
                {description}
              </p>
              <span className="font-mono" style={{ fontSize: "10px", color: "var(--color-accent)", opacity: 0.5, marginTop: "auto" }}>
                Open →
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* ── How it works ── */}
      <motion.section {...FADE_UP(0.3)} aria-label="How Mnemo works">
        <h2
          className="font-mono"
          style={{ fontSize: "10px", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 20px" }}
        >
          How Mnemo Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          {HOW_IT_WORKS.map(({ step, label, detail }, i) => (
            <div
              key={step}
              style={{
                padding: "28px 24px",
                borderRight: i < HOW_IT_WORKS.length - 1 ? "1px solid var(--color-border)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                background: "var(--color-surface-1)",
              }}
            >
              <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-accent)", letterSpacing: "0.2em" }}>
                {step}
              </span>
              <span className="font-mono" style={{ fontSize: "13px", color: "var(--color-ink)", fontWeight: 500 }}>
                {label}
              </span>
              <p className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-muted)", margin: 0, lineHeight: 1.7 }}>
                {detail}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Manifesto callout ── */}
      <motion.section
        {...FADE_UP(0.4)}
        aria-label="About Mnemo"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          borderLeft: "3px solid var(--color-accent)",
          borderRadius: "var(--radius)",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: "9px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.2em" }}
        >
          What is Mnemo?
        </span>
        <blockquote
          className="font-heading"
          style={{ margin: 0, fontSize: "clamp(16px, 2vw, 20px)", color: "var(--color-ink)", fontStyle: "italic", lineHeight: 1.6 }}
        >
          &ldquo;Your codebase has been trying to warn you.&rdquo;
        </blockquote>
        <p
          className="font-mono"
          style={{ margin: 0, fontSize: "12px", color: "var(--color-ink-muted)", lineHeight: 1.8, maxWidth: "680px" }}
        >
          Mnemo is institutional memory for engineering teams. It watches every decision your team makes — every architecture call, every deprecated pattern,
          every &ldquo;we tried this and it failed&rdquo; — and remembers it permanently. When the same mistake is about to happen again, Mnemo warns you before it ships.
          No more tribal knowledge living only in Slack threads or the heads of engineers who left six months ago.
        </p>
      </motion.section>
    </div>
  );
}
