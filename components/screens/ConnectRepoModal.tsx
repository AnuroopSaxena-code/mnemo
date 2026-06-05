"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectRepoModalProps {
  onConnected: (repoName: string) => void;
  onClose?: () => void;
}

import { useEffect } from "react";

export function ConnectRepoModal({ onConnected, onClose }: ConnectRepoModalProps) {
  const [scanning, setScanning] = useState(false);
  const [scanningRepo, setScanningRepo] = useState("");
  const [repos, setRepos] = useState<{ id: string; name: string }[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/repos/available");
        if (res.ok) {
          const data = await res.json();
          setRepos(data.repos || []);
        }
      } catch (err) {
        console.error("Failed to load available repos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRepos();
  }, []);

  function toggleSelection(repoId: string) {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) next.delete(repoId);
      else next.add(repoId);
      return next;
    });
  }

  async function startScan() {
    if (selectedRepos.size === 0) return;

    const selectedRepoObjects = repos.filter((r) => selectedRepos.has(r.id));
    if (selectedRepos.size === 1) {
      setScanningRepo((selectedRepoObjects[0] as any).fullName);
    } else {
      setScanningRepo(`${selectedRepos.size} repositories`);
    }

    setScanning(true);

    try {
      const connectPromises = selectedRepoObjects.map(async (repo) => {
        const name = (repo as any).fullName;
        const res = await fetch("/api/repos/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoId: repo.id, fullName: name, isPrivate: false })
        });
        if (res.ok) {
          // Run sync comments after connection
          await fetch("/api/repos/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: name })
          });
        } else {
          console.error(`Failed to connect ${name}`);
        }
      });

      await Promise.all(connectPromises);

      const firstName = (selectedRepoObjects[0] as any).fullName;
      setTimeout(() => onConnected(firstName), 1800);
    } catch (err) {
      console.error(err);
      alert("Failed connecting repositories.");
      setScanning(false);
    }
  }

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <motion.article
        style={{
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          padding: 40,
          position: "relative",
          overflow: "hidden",
        }}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.04, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div
              key="scanning"
              className="flex items-center justify-center"
              style={{ minHeight: 120 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="amber-loader" style={{ position: "relative" }}>
                <p
                  className="font-mono blink-cursor"
                  style={{ fontSize: 13, color: "var(--color-accent)" }}
                >
                  scanning {scanningRepo} for decisions...
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    position: "absolute",
                    top: -16,
                    right: -16,
                    background: "transparent",
                    border: "none",
                    color: "var(--color-ink)",
                    fontSize: 28,
                    cursor: "pointer",
                    padding: 8,
                  }}
                  className="btn-press"
                  aria-label="Close"
                >
                  &times;
                </button>
              )}
              <h2
                className="font-heading"
                style={{
                  fontSize: 24,
                  color: "var(--color-ink)",
                  margin: "0 0 16px 0",
                  fontWeight: 400,
                }}
              >
                Connect a repository
              </h2>

              <div
                style={{
                  margin: "8px 0 0 0",
                  maxHeight: 240,
                  overflow: "auto",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                {loading ? (
                  <div style={{ padding: "12px 0", textAlign: "center", color: "var(--color-ink-muted)" }} className="font-mono text-xs">
                    loading repositories...
                  </div>
                ) : repos.length === 0 ? (
                  <div style={{ padding: "12px 0", textAlign: "center", color: "var(--color-ink-muted)" }} className="font-mono text-xs">
                    no repositories found
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {repos.map((repo) => {
                    const isSelected = selectedRepos.has(repo.id);
                    return (
                      <li key={repo.id}>
                        <button
                          className="btn-press"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "12px 16px",
                            background: isSelected ? "var(--color-surface-2)" : "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--color-border)",
                            borderLeft: isSelected ? "2px solid var(--color-accent)" : "2px solid transparent",
                            cursor: "pointer",
                            color: "var(--color-ink)",
                            transition: "all 0.15s ease",
                          }}
                          onClick={() => toggleSelection(repo.id)}
                        >
                          <span className="flex items-center" style={{ gap: 8 }}>
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: "var(--color-green)",
                                opacity: isSelected ? 1 : 0.4,
                              }}
                              aria-hidden="true"
                            />
                            <span className="font-mono" style={{ fontSize: 13, color: isSelected ? "var(--color-ink)" : "var(--color-ink-muted)" }}>
                              {(repo as any).fullName}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  </ul>
                )}
              </div>

              {/* Continue Action */}
              <AnimatePresence>
                {selectedRepos.size > 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <button
                      className="btn-press font-mono"
                      onClick={startScan}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "var(--color-accent)",
                        color: "var(--color-bg)",
                        border: "none",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Continue with {selectedRepos.size} selected {selectedRepos.size === 1 ? "repo" : "repos"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </motion.div>
  );
}
