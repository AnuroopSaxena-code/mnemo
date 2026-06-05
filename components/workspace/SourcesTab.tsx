"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedDecision {
  decision: string;
  rationale: string;
  alternatives: { name: string; rejectedBecause: string }[];
  caveats: string[];
  scope: string;
  hindsightId?: string;
  inferred?: boolean;
}

interface SourcesTabProps {
  activeRepo?: string;
}

export function SourcesTab({ activeRepo }: SourcesTabProps) {
  const [mode, setMode] = useState<"discover" | "manual">("discover");
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [sourceName, setSourceName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [parsed, setParsed] = useState<ParsedDecision | null>(null);
  
  const [discovered, setDiscovered] = useState<ParsedDecision[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setError(null);
    setHasScanned(true);
    try {
      const res = await fetch("/api/memory/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName: activeRepo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setDiscovered(data.discovered || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan codebase");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: sourceType, repoFullName: activeRepo, sourceName: sourceName }),
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

  async function handleStoreDiscovered(decision: ParsedDecision) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/retain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: `Inferred from codebase: ${decision.decision}. Rationale: ${decision.rationale}`, 
          extractedText: `DECISION: ${decision.decision}\nRATIONALE: ${decision.rationale}\nSCOPE: ${decision.scope}`, 
          source: "github", 
          repoFullName: activeRepo,
          sourceName: "Inferred from codebase structure" 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Storage failed");
      
      setSuccessMsg(`Decision '${decision.decision.substring(0, 30)}...' stored successfully.`);
      setDiscovered(prev => prev.filter(d => d !== decision));
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to store");
    } finally {
      setLoading(false);
    }
  }

  async function handleStoreManual() {
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
          repoFullName: activeRepo,
          sourceName: sourceName 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Storage failed");
      setSuccessMsg("Decision successfully stored to Hindsight memory and Database.");
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
      <header style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="font-heading" style={{ fontSize: "clamp(18px, 2.5vw, 24px)", color: "var(--color-ink)", fontWeight: 400, margin: "0 0 4px" }}>
            Source Inbox
          </h2>
          <p className="font-mono" style={{ fontSize: "clamp(11px, 1.2vw, 13px)", color: "var(--color-ink-muted)", margin: 0 }}>
            Discover and ingest engineering decisions into memory.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", background: "var(--color-surface-2)", padding: "4px", borderRadius: "var(--radius)" }}>
          <button 
            onClick={() => setMode("discover")}
            style={{ padding: "6px 12px", border: "none", borderRadius: "var(--radius-sm)", fontSize: "11px", fontFamily: "var(--font-mono)", cursor: "pointer", background: mode === "discover" ? "var(--color-surface-1)" : "transparent", color: mode === "discover" ? "var(--color-ink)" : "var(--color-ink-muted)", boxShadow: mode === "discover" ? "0 1px 2px rgba(0,0,0,0.1)" : "none" }}
          >
            Discover
          </button>
          <button 
            onClick={() => setMode("manual")}
            style={{ padding: "6px 12px", border: "none", borderRadius: "var(--radius-sm)", fontSize: "11px", fontFamily: "var(--font-mono)", cursor: "pointer", background: mode === "manual" ? "var(--color-surface-1)" : "transparent", color: mode === "manual" ? "var(--color-ink)" : "var(--color-ink-muted)", boxShadow: mode === "manual" ? "0 1px 2px rgba(0,0,0,0.1)" : "none" }}
          >
            Manual Entry
          </button>
        </div>
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

      {mode === "discover" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "24px", background: "var(--color-surface-2)", borderRadius: "var(--radius)", textAlign: "center" }}>
            <p className="font-body" style={{ color: "var(--color-ink-dim)", fontSize: "clamp(14px, 1.6vw, 16px)", marginBottom: "16px" }}>
              Mnemo can scan your raw codebase via Hindsight to infer structural design decisions that were never formally recorded.
            </p>
            <button onClick={handleScan} disabled={loading} className="cta-amber btn-press" style={{ padding: "10px 24px" }}>
              {loading ? "Scanning Codebase..." : "Scan for Unrecorded Decisions"}
            </button>
          </div>

          {hasScanned && !loading && discovered.length === 0 && (
            <p className="font-mono" style={{ textAlign: "center", color: "var(--color-ink-muted)", fontSize: "clamp(12px, 1.4vw, 14px)", padding: "20px" }}>
              No undocumented structural decisions found.
            </p>
          )}

          {discovered.map((dec, idx) => (
            <div key={idx} style={{ padding: "16px", background: "var(--color-surface-1)", borderLeft: "2px solid var(--color-accent)", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "12px", wordBreak: "break-word", overflowWrap: "anywhere" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 className="font-mono" style={{ margin: "0 0 4px", fontSize: "clamp(14px, 1.8vw, 16px)", color: "var(--color-ink)", fontWeight: "bold" }}>{dec.decision}</h4>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-accent)", background: "rgba(224, 130, 49, 0.1)", padding: "2px 6px", borderRadius: "var(--radius-sm)", textTransform: "uppercase" }}>AI Generated from Code</span>
                </div>
                <button onClick={() => handleStoreDiscovered(dec)} disabled={loading} className="cta-outlined btn-press" style={{ fontSize: "11px", padding: "6px 12px" }}>
                  Store & Track
                </button>
              </div>
              <div>
                <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Rationale</span>
                <p className="font-body" style={{ margin: "4px 0 0", fontSize: "clamp(13px, 1.5vw, 15px)", color: "var(--color-ink-dim)" }}>{dec.rationale}</p>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Scope</span>
                  <p className="font-body" style={{ margin: "4px 0 0", fontSize: "clamp(13px, 1.5vw, 15px)", color: "var(--color-ink-dim)" }}>{dec.scope}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "manual" && (
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
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste the discussion, PR description, or architecture notes here..." style={{ width: "100%", height: "200px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: "clamp(13px, 1.5vw, 16px)", padding: "12px", resize: "none" }} />
              </div>

              <button onClick={handleExtract} disabled={loading || !text.trim()} className="cta-amber btn-press" style={{ alignSelf: "flex-start", padding: "10px 20px" }}>
                {loading ? "Extracting..." : "Extract Decision"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ padding: "16px", background: "var(--color-surface-1)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                <h3 className="font-mono" style={{ fontSize: "clamp(11px, 1.2vw, 13px)", color: "var(--color-accent)", margin: "0 0 12px", textTransform: "uppercase" }}>Review Extraction</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Decision</span>
                    <p className="font-body" style={{ margin: "4px 0 0", fontSize: "clamp(14px, 1.8vw, 16px)", color: "var(--color-ink)" }}>{parsed?.decision || "None"}</p>
                  </div>
                  <div>
                    <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Rationale</span>
                    <p className="font-body" style={{ margin: "4px 0 0", fontSize: "clamp(14px, 1.8vw, 16px)", color: "var(--color-ink)" }}>{parsed?.rationale || "None"}</p>
                  </div>
                  <div>
                    <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Scope</span>
                    <p className="font-body" style={{ margin: "4px 0 0", fontSize: "clamp(14px, 1.8vw, 16px)", color: "var(--color-ink)" }}>{parsed?.scope || "global"}</p>
                  </div>
                  {parsed && parsed.caveats.length > 0 && (
                    <div>
                      <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Caveats</span>
                      <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "clamp(14px, 1.8vw, 16px)", color: "var(--color-ink)" }}>
                        {parsed.caveats.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {parsed && parsed.alternatives.length > 0 && (
                    <div>
                      <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>Alternatives Rejected</span>
                      <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "clamp(14px, 1.8vw, 16px)", color: "var(--color-ink)" }}>
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
                <button onClick={handleStoreManual} disabled={loading} className="cta-amber btn-press" style={{ padding: "10px 20px" }}>
                  {loading ? "Storing..." : "Store Decision"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
