"use client";

import { motion } from "framer-motion";

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const PLATFORMS = [
  {
    id: "discord",
    name: "Discord",
    status: "available",
    tagline: "Surface memory in your engineering channels",
    description:
      "Connect Mnemo to your Discord server and let your team query architectural decisions directly inside chat. Ask questions, run pre-mortems, and get historical context without leaving Discord.",
    features: [
      "Query memory with /mnemo ask",
      "Pre-mortem checks from any channel",
      "Automated alerts on stale or reversed decisions",
      "Onboarding briefs on demand",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={32} height={32}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    color: "#5865F2",
    ctaLabel: "Connect Discord",
  },
  {
    id: "slack",
    name: "Slack",
    status: "available",
    tagline: "Bring institutional memory into your workspace",
    description:
      "Install the Mnemo Slack app and let engineers ask questions in any channel. Get context on past decisions, flag risky PRs, and onboard new teammates — all without leaving Slack.",
    features: [
      "Natural language memory queries in any channel",
      "Slash command /mnemo premortem for instant risk checks",
      "Thread replies with cited decision sources",
      "Weekly digest of stale and reversed decisions",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={32} height={32}>
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
    color: "#4A154B",
    ctaLabel: "Connect Slack",
  },
];

export function ConnectSocialsTab() {
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
      {/* Header */}
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
          Integrations
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
          Connect Socials
        </h1>
        <div style={{ height: 1, background: "linear-gradient(90deg, var(--color-accent), transparent)", maxWidth: 280, marginTop: 4 }} />
        <p
          className="font-mono"
          style={{
            fontSize: "13px",
            color: "var(--color-ink-muted)",
            margin: 0,
            maxWidth: "560px",
            lineHeight: 1.7,
            marginTop: 4,
          }}
        >
          Bring Mnemo&apos;s institutional memory into the tools your team already lives in. Query decisions,
          run pre-mortems, and surface warnings — without leaving your chat.
        </p>
      </motion.header>

      {/* Integration tiles */}
      <motion.section
        {...FADE_UP(0.1)}
        aria-label="Social integration options"
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {PLATFORMS.map(({ id, name, tagline, description, features, icon, color, ctaLabel }) => (
          <article
            key={id}
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "36px 40px",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "32px",
              alignItems: "start",
            }}
          >
            {/* Left: info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Platform label */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ color }}>{icon}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h2
                    className="font-mono"
                    style={{ fontSize: "18px", color: "var(--color-ink)", margin: 0, fontWeight: 500 }}
                  >
                    {name}
                  </h2>
                  <span className="font-mono" style={{ fontSize: "11px", color, opacity: 0.9 }}>
                    {tagline}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p
                className="font-body"
                style={{
                  fontSize: "13px",
                  color: "var(--color-ink-dim)",
                  margin: 0,
                  lineHeight: 1.75,
                  maxWidth: "520px",
                }}
              >
                {description}
              </p>

              {/* Feature list */}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {features.map((feat) => (
                  <li
                    key={feat}
                    className="font-mono"
                    style={{ fontSize: "12px", color: "var(--color-ink-muted)", display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <span style={{ color: "var(--color-accent)", flexShrink: 0 }}>›</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "12px",
                paddingTop: "4px",
              }}
            >
              <button
                className="btn-press"
                disabled
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-accent)",
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "12px 24px",
                  borderRadius: 0,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "not-allowed",
                  opacity: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {ctaLabel}
              </button>
              <span
                className="font-mono"
                style={{ fontSize: "10px", color: "var(--color-ink-ghost)", textAlign: "right" }}
              >
                Backend integration coming soon
              </span>
            </div>
          </article>
        ))}
      </motion.section>

      {/* Footer callout */}
      <motion.section
        {...FADE_UP(0.2)}
        aria-label="More integrations"
        style={{
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius)",
          padding: "28px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="font-mono" style={{ fontSize: "13px", color: "var(--color-ink-muted)" }}>
            More integrations on the roadmap
          </span>
          <span className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-ghost)" }}>
            GitHub Discussions, Linear, Notion, Jira — request what you need.
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-ghost)", whiteSpace: "nowrap" }}>
          07 / coming soon
        </span>
      </motion.section>
    </div>
  );
}
