"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface SidebarProps {
  repos: string[];
  activeRepo: string;
  decisionCount: number;
  onRepoSelect: (repo: string) => void;
  activeTab: string;
  onTabSelect: (tab: string) => void;
  authInfo?: any;
}

const TABS = [
  { id: "premortem", label: "pre-mortem agent", index: "01" },
  { id: "ask", label: "ask memory", index: "02" },
  { id: "timeline", label: "decision timeline", index: "03" },
  { id: "onboarding", label: "onboarding brief", index: "04" },
  { id: "sources", label: "source inbox", index: "05" },
];

const INTEGRATIONS = [
  { id: "github", label: "GitHub App", connectUrl: "/api/auth/login/github" },
  { id: "slack", label: "Slack Bot", connectUrl: "/api/integrations/slack/connect" },
  { id: "discord", label: "Discord Bot", connectUrl: "/api/integrations/discord/connect" },
];

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.reload();
}

export function Sidebar({
  repos,
  activeRepo,
  decisionCount,
  onRepoSelect,
  activeTab,
  onTabSelect,
  authInfo,
}: SidebarProps) {
  const connectedPlatforms = authInfo?.workspace?.integrations || [];

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        flexShrink: 0,
        background: "var(--color-surface-1)",
      }}
    >
      {/* Wordmark + amber pulse dot */}
      <header
        className="flex items-center"
        style={{ padding: "0 24px", gap: 10, marginTop: 16, marginBottom: 40 }}
      >
        <h1
          className="font-display"
          style={{
            fontSize: 20,
            color: "var(--color-accent)",
            margin: 0,
            fontWeight: 400,
            letterSpacing: "0.12em",
          }}
        >
          mnemo
        </h1>
        <span
          className="amber-pulse-dot"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--color-accent)",
            flexShrink: 0,
          }}
          aria-label="Memory active"
        />
      </header>

      {/* Tab navigation */}
      <nav style={{ marginBottom: 32 }} aria-label="Agent features">
        <p
          className="font-mono"
          style={{
            fontSize: 9,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            padding: "0 24px",
            margin: "0 0 12px",
          }}
        >
          memory modules
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <li key={tab.id}>
                <button
                  className="btn-press"
                  onClick={() => onTabSelect(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "10px 24px",
                    background: isActive
                      ? "var(--color-accent-dim)"
                      : "transparent",
                    border: "none",
                    borderLeft: isActive
                      ? "2px solid var(--color-accent)"
                      : "2px solid transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-ink-muted)",
                    textAlign: "left",
                    transition:
                      "color 150ms ease, border-color 150ms ease, background-color 150ms ease",
                  }}
                >
                  <span
                    style={{
                      color: isActive
                        ? "var(--color-accent)"
                        : "var(--color-ink-ghost)",
                      marginRight: 8,
                      fontSize: 10,
                    }}
                  >
                    {tab.index}
                  </span>
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Repos scope selector */}
      <nav style={{ flex: 1 }} aria-label="Connected repositories">
        <p
          className="font-mono"
          style={{
            fontSize: 9,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            padding: "0 24px",
            margin: "0 0 12px",
          }}
        >
          connected repos
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {repos.map((repo) => {
            const isActive = repo === activeRepo;
            return (
              <li key={repo}>
                <button
                  className="btn-press"
                  onClick={() => onRepoSelect(repo)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "8px 24px",
                    background: "transparent",
                    border: "none",
                    borderLeft: isActive
                      ? "2px solid var(--color-accent)"
                      : "2px solid transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: isActive
                      ? "var(--color-ink)"
                      : "var(--color-ink-muted)",
                    textAlign: "left",
                    transition: "color 150ms ease, border-color 150ms ease",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isActive
                        ? "var(--color-green)"
                        : "var(--color-ink-muted)",
                      marginRight: 10,
                      flexShrink: 0,
                    }}
                  />
                  {repo}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Active Syncs panel — dynamic with CONNECT buttons */}
      <nav style={{ padding: "0 24px", marginBottom: 32 }} aria-label="Integrations status">
        <p
          className="font-mono"
          style={{
            fontSize: 9,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            margin: "0 0 12px",
          }}
        >
          active syncs
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {INTEGRATIONS.map((item) => {
            const isConnected = connectedPlatforms.includes(item.id);
            return (
              <li key={item.id} style={{ display: "flex", alignItems: "center", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-ink-dim)" }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: isConnected ? "var(--color-green)" : "var(--color-accent)",
                    marginRight: 10,
                    flexShrink: 0,
                    boxShadow: isConnected ? "0 0 8px var(--color-green)" : "none",
                  }}
                />
                {item.label}
                {isConnected ? (
                  <span style={{ marginLeft: "auto", fontSize: 8, color: "var(--color-green)" }}>
                    LIVE
                  </span>
                ) : (
                  <a
                    href={item.connectUrl}
                    style={{
                      marginLeft: "auto",
                      fontSize: 8,
                      color: "var(--color-accent)",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em",
                      padding: "2px 6px",
                      border: "1px solid var(--color-accent)",
                      borderRadius: 3,
                      transition: "background 150ms ease, color 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "var(--color-accent)";
                      (e.target as HTMLElement).style.color = "var(--color-bg)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "transparent";
                      (e.target as HTMLElement).style.color = "var(--color-accent)";
                    }}
                  >
                    CONNECT
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with decision count + Logout */}
      <footer
        style={{
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--color-accent)",
            }}
            aria-hidden="true"
          />
          <p
            className="font-mono"
            style={{ fontSize: 11, color: "var(--color-ink-muted)", margin: 0 }}
          >
            {decisionCount} decisions retained
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono btn-press"
          style={{
            fontSize: 9,
            color: "var(--color-ink-ghost)",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: 3,
            padding: "3px 8px",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            transition: "color 150ms ease, border-color 150ms ease",
          }}
        >
          Logout
        </button>
      </footer>
    </aside>
  );
}

/* Mobile bottom sheet variant */
export function MobileSidebar({
  repos,
  activeRepo,
  decisionCount,
  onRepoSelect,
  activeTab,
  onTabSelect,
  onClose,
  authInfo,
}: SidebarProps & { onClose: () => void }) {
  const connectedPlatforms = authInfo?.workspace?.integrations || [];

  return (
    <motion.div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.6)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--color-surface-1)",
          borderTop: "1px solid var(--color-border)",
          borderRadius: "var(--radius) var(--radius) 0 0",
          padding: "24px 24px 40px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between"
          style={{ marginBottom: 20 }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <span
              className="font-display"
              style={{ fontSize: 18, color: "var(--color-accent)" }}
            >
              mnemo
            </span>
            <span
              className="amber-pulse-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-accent)",
              }}
              aria-hidden="true"
            />
          </div>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--color-ink-muted)" }}
          >
            {decisionCount} decisions
          </span>
        </header>

        {/* Mobile Tabs */}
        <nav style={{ marginBottom: 24 }} aria-label="Agent features">
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  className="btn-press"
                  onClick={() => {
                    onTabSelect(tab.id);
                    onClose();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color:
                      tab.id === activeTab
                        ? "var(--color-accent)"
                        : "var(--color-ink-dim)",
                    textAlign: "left",
                  }}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Repos */}
        <nav aria-label="Connected repositories">
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--color-ink-muted)",
              margin: "0 0 8px",
            }}
          >
            connected repos
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {repos.map((repo) => (
              <li key={repo}>
                <button
                  className="btn-press"
                  onClick={() => {
                    onRepoSelect(repo);
                    onClose();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color:
                      repo === activeRepo
                        ? "var(--color-accent)"
                        : "var(--color-ink-dim)",
                    textAlign: "left",
                  }}
                >
                  {repo}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Active Syncs panel with CONNECT buttons */}
        <nav style={{ marginTop: 24 }} aria-label="Integrations status">
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--color-ink-muted)",
              margin: "0 0 12px",
            }}
          >
            active syncs
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {INTEGRATIONS.map((item) => {
              const isConnected = connectedPlatforms.includes(item.id);
              return (
                <li key={item.id} style={{ display: "flex", alignItems: "center", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-ink-dim)" }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isConnected ? "var(--color-green)" : "var(--color-accent)",
                      marginRight: 10,
                      flexShrink: 0,
                      boxShadow: isConnected ? "0 0 8px var(--color-green)" : "none",
                    }}
                  />
                  {item.label}
                  {isConnected ? (
                    <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--color-green)" }}>
                      LIVE
                    </span>
                  ) : (
                    <a
                      href={item.connectUrl}
                      style={{
                        marginLeft: "auto",
                        fontSize: 9,
                        color: "var(--color-accent)",
                        textDecoration: "none",
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        border: "1px solid var(--color-accent)",
                        borderRadius: 3,
                      }}
                    >
                      CONNECT
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Logout */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={handleLogout}
            className="font-mono btn-press"
            style={{
              fontSize: 10,
              color: "var(--color-ink-ghost)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: 3,
              padding: "6px 12px",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              width: "100%",
            }}
          >
            Logout
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}
