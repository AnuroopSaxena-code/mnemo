"use client";

import { useState, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DecisionRecord, ChatAnswer, RecalledMemory } from "@/lib/types";

interface AskMemoryTabProps {
  onDecisionClick: (decision: DecisionRecord) => void;
  suggestedQueries: string[];
  showcaseMode?: boolean;
}

/** Split answer text into sentences for staggered reveal */
function splitSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return [text];
  return sentences.map((s) => s.trim()).filter(Boolean);
}

export function AskMemoryTab({
  onDecisionClick,
  suggestedQueries,
  showcaseMode,
}: AskMemoryTabProps) {
  const [query, setQuery] = useState("");
  const [useMemory, setUseMemory] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(questionOverride?: string) {
    const q = questionOverride || query;
    if (!q.trim()) return;
    setQuery(q);
    setSubmitted(true);
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/memory/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Request failed.");
      setAnswer(json as ChatAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to query memory.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  const dejaVu = answer?.evidence?.find(
    (e: RecalledMemory) =>
      e.record?.state === "reversed" || e.record?.state === "revisited"
  );

  const sentences = answer ? splitSentences(answer.answer) : [];

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
      {/* Header and Toggle */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "16px",
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
            Ask Codebase Memory
          </h2>
          <p
            className="font-mono"
            style={{
              fontSize: "11px",
              color: "var(--color-ink-muted)",
              margin: 0,
            }}
          >
            Query decisions made 6, 12, or 18 months ago.
          </p>
        </div>

        {/* Demo Toggle Control */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--color-surface-2)",
            padding: "4px 8px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: "10px",
              color: !useMemory
                ? "var(--color-accent)"
                : "var(--color-ink-muted)",
            }}
          >
            generic llm
          </span>
          <button
            onClick={() => setUseMemory(!useMemory)}
            style={{
              width: "36px",
              height: "20px",
              borderRadius: "10px",
              background: useMemory
                ? "var(--color-accent)"
                : "var(--color-surface-1)",
              border: useMemory
                ? "none"
                : "1px solid var(--color-border)",
              position: "relative",
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
            aria-label="Toggle memory mode"
          >
            <motion.div
              layout
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: useMemory ? "var(--color-bg)" : "var(--color-ink-muted)",
                position: "absolute",
                top: "3px",
                left: useMemory ? "19px" : "3px",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span
            className="font-mono"
            style={{
              fontSize: "10px",
              color: useMemory
                ? "var(--color-accent)"
                : "var(--color-ink-muted)",
            }}
          >
            mnemo memory
          </span>
        </div>
      </header>

      {/* Input Form */}
      <form
        onSubmit={handleFormSubmit}
        style={{ width: "100%", position: "relative" }}
      >
        <input
          ref={inputRef}
          id="query-input"
          className="input-minimal"
          style={{
            width: "100%",
            fontSize: "18px",
            padding: "16px 0",
            fontFamily: "var(--font-mono)",
            borderBottom: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-ink)",
          }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="why did we move off Kafka?"
          autoFocus
        />
        <button
          type="submit"
          className="font-mono"
          style={{
            position: "absolute",
            right: 0,
            bottom: "16px",
            background: "transparent",
            border: "none",
            color: "var(--color-accent)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          \u23ce
        </button>
      </form>

      {/* Suggestions Chips */}
      {!submitted && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {suggestedQueries.map((sq) => (
            <button
              key={sq}
              className="btn-press"
              onClick={() => {
                setQuery(sq);
                handleSubmit(sq);
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                padding: "6px 12px",
                color: "var(--color-ink-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--color-border-hover)";
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
      )}

      {/* Response Area */}
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
                  searching...
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
          ) : answer ? (
            <motion.div
              key="answer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                paddingTop: "12px",
              }}
            >
              {/* Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: useMemory
                    ? "var(--color-green)"
                    : "var(--color-warn)",
                  borderLeft: `2px solid ${useMemory ? "var(--color-green)" : "var(--color-warn)"}`,
                  padding: "6px 12px",
                  background: "var(--color-surface-2)",
                  borderRadius: "var(--radius)",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: useMemory
                      ? "var(--color-green)"
                      : "var(--color-warn)",
                  }}
                />
                {useMemory
                  ? "MNEMO MEMORY ACTIVE \u2014 synthesized using Hindsight index"
                  : "MEMORYLESS \u2014 generic LLM assumptions only"}
              </div>

              {/* D\u00e9j\u00e0 vu warning */}
              {useMemory && dejaVu && dejaVu.record && (
                <div
                  style={{
                    borderLeft: "2px solid var(--color-warn)",
                    background: "rgba(210, 153, 34, 0.06)",
                    padding: "12px",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <p
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: "var(--color-warn)",
                      margin: "0 0 4px",
                      fontWeight: "bold",
                    }}
                  >
                    REVERSAL WARNING:
                  </p>
                  <p
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: "var(--color-ink-dim)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    This query touches &quot;{dejaVu.record.title}&quot;, which
                    had a state of{" "}
                    <strong>{dejaVu.record.state}</strong> on{" "}
                    {dejaVu.record.date}.
                  </p>
                </div>
              )}

              {/* Sentence-by-sentence answer reveal */}
              <div
                style={{
                  maxWidth: "65ch",
                }}
              >
                {sentences.map((sentence, i) => (
                  <motion.span
                    key={i}
                    className="font-body"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.15,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      fontSize: "17px",
                      fontStyle: "italic",
                      color: "var(--color-ink)",
                      lineHeight: "1.7",
                    }}
                  >
                    {sentence}{" "}
                  </motion.span>
                ))}
              </div>

              {/* Cited Evidence Cards */}
              {useMemory &&
                answer.evidence &&
                answer.evidence.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <p
                      className="font-mono"
                      style={{
                        fontSize: "9px",
                        color: "var(--color-ink-muted)",
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      recalled knowledge citations
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {answer.evidence.map((memory) => {
                        const rec = memory.record;
                        if (!rec) return null;
                        const stateColor =
                          rec.state === "reversed"
                            ? "var(--color-error)"
                            : rec.state === "stale"
                            ? "var(--color-warn)"
                            : "var(--color-accent)";
                        return (
                          <div
                            key={memory.id}
                            style={{
                              background: "var(--color-surface-2)",
                              borderLeft: `2px solid ${stateColor}`,
                              borderRadius: "var(--radius)",
                              padding: "12px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <div>
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
                                    fontWeight: "bold",
                                  }}
                                >
                                  {rec.id}
                                </span>
                                <span
                                  className="font-mono"
                                  style={{
                                    fontSize: "9px",
                                    color: stateColor,
                                    textTransform: "uppercase",
                                    fontWeight: 600,
                                  }}
                                >
                                  {rec.state}
                                </span>
                              </div>
                              <h4
                                className="font-mono"
                                style={{
                                  fontSize: "12px",
                                  color: "var(--color-ink)",
                                  margin: "0 0 4px",
                                }}
                              >
                                {rec.title}
                              </h4>
                              <p
                                className="font-body"
                                style={{
                                  fontSize: "11px",
                                  fontStyle: "italic",
                                  color: "var(--color-ink-dim)",
                                  margin: 0,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {rec.decision}
                              </p>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderTop:
                                  "1px solid var(--color-border)",
                                paddingTop: "6px",
                              }}
                            >
                              <span
                                className="font-mono"
                                style={{
                                  fontSize: "9px",
                                  color: "var(--color-ink-muted)",
                                }}
                              >
                                {rec.date} \u00b7 @
                                {rec.people[0] || "team"}
                              </span>
                              <button
                                onClick={() => onDecisionClick(rec)}
                                className="font-mono btn-press"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--color-accent)",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                inspect \u2192
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
