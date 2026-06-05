"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedDecision {
  decision: string;
  rationale: string;
  alternatives: { name: string; rejectedBecause: string }[];
  caveats: string[];
  scope: string;
}

export function SourcesTab() {
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [sourceName, setSourceName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [parsed, setParsed] = useState<ParsedDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: sourceType, repoFullName: sourceName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setExtractedText(data.extractedText);
      setParsed(data.parsed);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract");
    } finally {
      setLoading(false);
    }
  }

  async function handleStore() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/retain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          extractedText, 
          source: sourceType, 
          repoFullName: sourceName 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Storage failed");
      setSuccessMsg("Decision successfully stored to Hindsight memory and Database.");
      // Reset form
      setTimeout(() => {
        setStep(1);
        setText("");
        setSourceName("");
        setSuccessMsg(null);
        setParsed(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to store");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px", minHeight: "100vh", maxWidth: "800px" }}>
      <header style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
        <h2 className="font-heading" style={{ fontSize: "18px", color: "var(--color-ink)", fontWeight: 400, margin: "0 0 4px" }}>
          Source Inbox
        </h2>
        <p className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-muted)", margin: 0 }}>
          Manually ingest engineering decisions into memory.
        </p>
      </header>

      {error && (
        <div style={{ padding: "12px", background: "var(--color-surface-1)", borderLeft: "2px solid var(--color-error)", color: "var(--color-error)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "12px", background: "var(--color-surface-1)", borderLeft: "2px solid var(--color-green)", color: "var(--color-green)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
          {successMsg}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Source System</label>
                <select value={sourceType} onChange={e => setSourceType(e.target.value)} style={{ width: "100%", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px", borderRadius: "var(--radius)" }}>
                  <option value="github">GitHub PR</option>
                  <option value="slack">Slack Channel</option>
                  <option value="discord">Discord Thread</option>
                  <option value="adr">ADR Document</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Source Name</label>
                <input type="text" value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="e.g. PR #123, ADR-001" style={{ width: "100%", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px", borderRadius: "var(--radius)" }} />
              </div>
            </div>
            
            <div>
              <label className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Raw Content</label>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste the discussion, PR description, or architecture notes here..." style={{ width: "100%", height: "200px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: "13px", padding: "12px", resize: "none" }} />
            </div>

            <button onClick={handleExtract} disabled={loading || !text.trim()} className="cta-amber btn-press" style={{ alignSelf: "flex-start", padding: "10px 20px" }}>
              {loading ? "Extracting..." : "Extract Decision"}
            </button>
          </motion.div>
        ) : (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "16px", background: "var(--color-surface-1)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
              <h3 className="font-mono" style={{ fontSize: "11px", color: "var(--color-accent)", margin: "0 0 12px", textTransform: "uppercase" }}>Review Extraction</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Decision</span>
                  <p className="font-body" style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-ink)" }}>{parsed?.decision || "None"}</p>
                </div>
                <div>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Rationale</span>
                  <p className="font-body" style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-ink)" }}>{parsed?.rationale || "None"}</p>
                </div>
                <div>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Scope</span>
                  <p className="font-body" style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-ink)" }}>{parsed?.scope || "global"}</p>
                </div>
                {parsed && parsed.caveats.length > 0 && (
                  <div>
                    <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Caveats</span>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "14px", color: "var(--color-ink)" }}>
                      {parsed.caveats.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {parsed && parsed.alternatives.length > 0 && (
                  <div>
                    <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Alternatives Rejected</span>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "14px", color: "var(--color-ink)" }}>
                      {parsed.alternatives.map((a, i) => (
                        <li key={i}><strong>{a.name}</strong>: {a.rejectedBecause}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStep(1)} disabled={loading} className="cta-outlined btn-press" style={{ padding: "10px 20px" }}>
                Back to Edit
              </button>
              <button onClick={handleStore} disabled={loading} className="cta-amber btn-press" style={{ padding: "10px 20px" }}>
                {loading ? "Storing..." : "Store Decision"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
