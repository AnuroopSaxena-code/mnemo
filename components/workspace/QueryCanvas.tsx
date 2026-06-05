"use client";

import { useState, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DecisionRecord, ChatAnswer, RecalledMemory } from "@/lib/types";

interface QueryCanvasProps {
  repoName: string;
  suggestedQueries: string[];
  onAskMemory: (question: string) => Promise<ChatAnswer>;
  decisions: DecisionRecord[];
}

export function QueryCanvas({ repoName, suggestedQueries, onAskMemory, decisions }: QueryCanvasProps) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for déjà vu — if the answer matches a reversed decision
  const dejaVu = answer?.evidence?.find(
    (e: RecalledMemory) => e.record?.state === "reversed" || e.record?.state === "revisited"
  );

  async function handleSubmit(questionOverride?: string) {
    const q = questionOverride || query;
    if (!q.trim()) return;
    setQuery(q);
    setSubmitted(true);
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const result = await onAskMemory(q);
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to recall.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  // State A — empty, centered
  if (!submitted) {
    return (
      <section
        className="flex flex-col items-center justify-center"
        style={{ flex: 1, minHeight: "100vh", padding: "0 24px" }}
      >
        <form onSubmit={handleFormSubmit} style={{ width: "100%", maxWidth: 640 }}>
          <input
            ref={inputRef}
            id="query-input"
            className="input-minimal"
            style={{
              width: "100%",
              fontSize: 18,
              padding: "16px 0",
              fontFamily: "var(--font-mono)"
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="why is this built this way?"
            autoFocus
          />
        </form>

        <div
          className="flex flex-wrap"
          style={{
            gap: 8,
            marginTop: 24,
            maxWidth: 640,
            width: "100%"
          }}
        >
          {suggestedQueries.map((sq) => (
            <button
              key={sq}
              className="btn-press"
              onClick={() => { setQuery(sq); handleSubmit(sq); }}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                padding: "8px 12px",
                color: "var(--color-ink-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                cursor: "pointer",
                transition: "border-color 150ms ease, color 150ms ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-hover)";
                e.currentTarget.style.color = "var(--color-ink-dim)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.color = "var(--color-ink-muted)";
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // State B — input pinned to top, answer below
  return (
    <section style={{ flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Pinned input */}
      <motion.header
        style={{
          padding: "24px 32px 16px",
          borderBottom: "1px solid var(--color-border)"
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <form onSubmit={handleFormSubmit}>
          <input
            ref={inputRef}
            className="input-minimal"
            style={{
              width: "100%",
              fontSize: 16,
              padding: "8px 0",
              fontFamily: "var(--font-mono)"
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </motion.header>

      {/* Answer area */}
      <div style={{ flex: 1, padding: "32px 32px 64px", maxWidth: 720 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="amber-loader"
              style={{ paddingTop: 40 }}
            >
              <span className="font-mono blink-cursor" style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
                recalling
              </span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ paddingTop: 40 }}
            >
              <p className="font-mono" style={{ fontSize: 13, color: "var(--color-ink-dim)" }}>
                {error}
              </p>
            </motion.div>
          ) : answer ? (
            <motion.div
              key="answer"
              initial={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{ paddingTop: 8 }}
            >
              {/* Déjà vu warning */}
              {dejaVu && (
                <DejaVuWarning memory={dejaVu} />
              )}

              {/* Answer text */}
              <p
                className="font-body"
                style={{
                  fontSize: 18,
                  fontStyle: "italic",
                  color: "var(--color-ink)",
                  lineHeight: 1.7,
                  maxWidth: "65ch",
                  margin: 0
                }}
              >
                {answer.answer}
              </p>

              {/* Metadata */}
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-muted)",
                  marginTop: 24,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4
                }}
              >
                {answer.evidence?.[0]?.source && (
                  <span>via {answer.evidence[0].source}</span>
                )}
                {answer.people && answer.people.length > 0 && (
                  <>
                    <span>·</span>
                    <span style={{ color: "var(--color-ink-dim)" }}>
                      @{answer.people[0]}
                    </span>
                  </>
                )}
                {answer.date && (
                  <>
                    <span>·</span>
                    <span>{answer.date}</span>
                  </>
                )}
              </div>

              {/* Source link */}
              {answer.evidence?.[0]?.source && (
                <p style={{ marginTop: 8 }}>
                  <a
                    href="#"
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--color-accent)",
                      textDecoration: "none",
                      borderBottom: "1px solid transparent",
                      transition: "border-color 150ms ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = "var(--color-accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
                  >
                    {answer.evidence[0].source}
                  </a>
                </p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* Déjà vu warning component */
function DejaVuWarning({ memory }: { memory: RecalledMemory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="deja-vu-pulse"
      style={{ marginBottom: 24, cursor: "pointer" }}
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
    >
      <p className="font-mono" style={{ fontSize: 12, color: "var(--color-accent)", margin: 0 }}>
        ⚠ this decision was made before
      </p>
      <AnimatePresence>
        {expanded && memory.record && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="font-mono"
              style={{
                fontSize: 11,
                color: "var(--color-ink-dim)",
                marginTop: 8,
                lineHeight: 1.7
              }}
            >
              {memory.record.state === "reversed"
                ? `Decided ${memory.record.date}. Reversed. The original reasoning was: ${memory.record.rationale}`
                : `Decided ${memory.record.date}. ${memory.record.rationale}`
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
