"use client";

import { motion } from "framer-motion";
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
  const timelineStates = decision.lifecycle?.length
    ? decision.lifecycle
    : [
        {
          id: "init",
          state: decision.state,
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
            margin: "0 0 32px 0",
            lineHeight: 1.3,
          }}
        >
          {decision.title}
        </h1>

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
