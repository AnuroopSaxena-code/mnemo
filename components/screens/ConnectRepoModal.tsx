"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectRepoModalProps {
  onConnected: (repoName: string) => void;
}

const demoRepos = [
  { name: "payments-service", lastCommit: "2 days ago", hasDecisions: true },
  { name: "user-auth-gateway", lastCommit: "5 days ago", hasDecisions: true },
  { name: "billing-events", lastCommit: "1 week ago", hasDecisions: false },
  { name: "dashboard-frontend", lastCommit: "3 weeks ago", hasDecisions: false },
  { name: "data-pipeline", lastCommit: "1 month ago", hasDecisions: false },
];

export function ConnectRepoModal({ onConnected }: ConnectRepoModalProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [showBrowse, setShowBrowse] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanningRepo, setScanningRepo] = useState("");

  function handleConnect() {
    const name = repoUrl.includes("/")
      ? repoUrl.split("/").pop() || repoUrl
      : repoUrl || "payments-service";
    startScan(name);
  }

  function startScan(name: string) {
    setScanningRepo(name);
    setScanning(true);
    setTimeout(() => onConnected(name), 2200);
  }

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ position: "fixed", inset: 0, zIndex: 20, background: "var(--color-bg)" }}
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
              <h2
                className="font-heading"
                style={{
                  fontSize: 24,
                  color: "var(--color-ink)",
                  margin: "0 0 32px 0",
                  fontWeight: 400,
                }}
              >
                Connect a repository
              </h2>

              <label
                className="font-mono"
                htmlFor="repo-url-input"
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-muted)",
                  display: "block",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                GitHub URL or owner/repo
              </label>
              <input
                id="repo-url-input"
                className="input-box"
                style={{ width: "100%", fontSize: 13 }}
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="acme/payments-service"
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />

              <button
                className="font-mono btn-press"
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 16,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-ink-muted)",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "8px 0",
                  textAlign: "left",
                }}
                onClick={() => setShowBrowse(!showBrowse)}
              >
                {showBrowse ? "hide repos \u2191" : "or browse your GitHub repos \u2193"}
              </button>

              <AnimatePresence>
                {showBrowse && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      listStyle: "none",
                      margin: "8px 0 0 0",
                      padding: 0,
                      maxHeight: 240,
                      overflow: "auto",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    {demoRepos.map((repo) => (
                      <li key={repo.name}>
                        <button
                          className="btn-press"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "12px 0",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--color-border)",
                            cursor: "pointer",
                            color: "var(--color-ink)",
                          }}
                          onClick={() => startScan(repo.name)}
                        >
                          <span className="flex items-center" style={{ gap: 8 }}>
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: repo.hasDecisions
                                  ? "var(--color-green)"
                                  : "var(--color-ink-muted)",
                              }}
                              aria-hidden="true"
                            />
                            <span className="font-mono" style={{ fontSize: 13 }}>
                              {repo.name}
                            </span>
                          </span>
                          <span
                            className="font-mono"
                            style={{ fontSize: 11, color: "var(--color-ink-muted)" }}
                          >
                            {repo.lastCommit}
                          </span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              <button
                id="connect-btn"
                className="cta-outlined btn-press"
                style={{ width: "100%", marginTop: 24 }}
                onClick={handleConnect}
              >
                Connect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </motion.div>
  );
}
