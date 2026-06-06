"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface SidebarProps {
  repos: any[];
  activeRepo: string;
  decisionCount: number;
  onRepoSelect: (repo: string) => void;
  activeTab: string;
  onTabSelect: (tab: string) => void;
  authInfo?: any;
  onAddRepoClick?: () => void;
}

const TABS = [
  { id: "overview", label: "workspace overview", index: "00" },
  { id: "premortem", label: "pre-mortem agent", index: "01" },
  { id: "ask", label: "ask memory", index: "02" },
  { id: "timeline", label: "decision timeline", index: "03" },
  { id: "onboarding", label: "onboarding brief", index: "04" },
  { id: "sources", label: "source inbox", index: "05" },
  { id: "socials", label: "connect socials", index: "06" },
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
  onAddRepoClick,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        minHeight: "100vh",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        flexShrink: 0,
        background: "var(--color-surface-1)",
        overflow: "hidden",
      }}
    >
      {/* Wordmark — click to go to overview */}
      <header
        style={{
          padding: isCollapsed ? "0" : "0 24px",
          marginTop: 16,
          marginBottom: 40,
          display: "flex",
          flexDirection: isCollapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: isCollapsed ? 16 : 0,
        }}
      >
        <button
          className="btn-press font-display"
          onClick={() => onTabSelect("overview")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: isCollapsed ? 28 : 20,
            color: "var(--color-accent)",
            fontWeight: 400,
            letterSpacing: "0.12em",
            cursor: "pointer",
          }}
          aria-label="Go to workspace overview"
        >
          {isCollapsed ? "m" : "mnemo"}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn-press"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-ink-muted)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isCollapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          )}
        </button>
      </header>

      {/* Tab navigation */}
      <nav style={{ marginBottom: 32 }} aria-label="Agent features">
        <motion.p
          className="font-mono"
          animate={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
            margin: isCollapsed ? 0 : "0 0 12px",
          }}
          style={{
            fontSize: 9,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            padding: "0 24px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          memory modules
        </motion.p>
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
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    width: "100%",
                    padding: isCollapsed ? "12px 0" : "10px 24px",
                    background: isActive ? "var(--color-accent-dim)" : "transparent",
                    border: "none",
                    borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: isActive ? "var(--color-accent)" : "var(--color-ink-muted)",
                    transition: "all 150ms ease",
                    whiteSpace: "nowrap",
                  }}
                  title={isCollapsed ? tab.label : undefined}
                >
                  <span
                    style={{
                      color: isActive ? "var(--color-accent)" : "var(--color-ink-ghost)",
                      marginRight: isCollapsed ? 0 : 8,
                      fontSize: isCollapsed ? 12 : 10,
                    }}
                  >
                    {tab.index}
                  </span>
                  {!isCollapsed && tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Repos scope selector */}
      <nav style={{ flex: 1 }} aria-label="Connected repositories">
        <motion.p
          className="font-mono"
          animate={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
            margin: isCollapsed ? 0 : "0 0 12px",
          }}
          style={{
            fontSize: 9,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            padding: "0 24px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          connected repos
        </motion.p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {repos.map((repo) => {
            const repoNameString = typeof repo === "string" ? repo : repo.fullName;
            const isActive = repoNameString === activeRepo;
            return (
              <li key={repoNameString}>
                <button
                  className="btn-press"
                  onClick={() => onRepoSelect(repoNameString)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    width: "100%",
                    padding: isCollapsed ? "12px 0" : "8px 24px",
                    background: "transparent",
                    border: "none",
                    borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: isActive ? "var(--color-ink)" : "var(--color-ink-muted)",
                    transition: "all 150ms ease",
                    whiteSpace: "nowrap",
                  }}
                  title={isCollapsed ? repoNameString : undefined}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isActive ? "var(--color-green)" : "var(--color-ink-muted)",
                      marginRight: isCollapsed ? 0 : 10,
                      flexShrink: 0,
                    }}
                  />
                  {!isCollapsed && repoNameString}
                </button>
              </li>
            );
          })}
          {onAddRepoClick && (
            <li style={{ marginTop: 8, padding: isCollapsed ? "0 12px" : "0 24px" }}>
              <button
                onClick={onAddRepoClick}
                className="font-mono btn-press"
                style={{
                  background: "transparent",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius)",
                  padding: isCollapsed ? "8px 0" : "6px 12px",
                  width: "100%",
                  color: "var(--color-ink-muted)",
                  fontSize: isCollapsed ? "14px" : "11px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 150ms ease",
                }}
                title={isCollapsed ? "Manage Repos" : undefined}
              >
                {isCollapsed ? "+" : "+ MANAGE REPOS"}
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer with decision count + Logout */}
      <footer
        style={{
          padding: isCollapsed ? "0" : "0 24px",
          display: "flex",
          flexDirection: isCollapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: isCollapsed ? 16 : 8,
        }}
      >
        <div style={{ display: isCollapsed ? "none" : "flex", alignItems: "center", gap: 8 }}>
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
            style={{ fontSize: 11, color: "var(--color-ink-muted)", margin: 0, whiteSpace: "nowrap" }}
          >
            {decisionCount} decisions retained
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono btn-press"
          style={{
            fontSize: isCollapsed ? 12 : 9,
            color: "var(--color-ink-ghost)",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: 3,
            padding: isCollapsed ? "6px" : "3px 8px",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            transition: "all 150ms ease",
            width: isCollapsed ? "40px" : "auto",
          }}
          title={isCollapsed ? "Logout" : undefined}
        >
          {isCollapsed ? "⎋" : "Logout"}
        </button>
      </footer>
    </motion.aside>
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
  onAddRepoClick,
}: SidebarProps & { onClose: () => void }) {
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
            <button
              className="btn-press font-display"
              onClick={() => { onTabSelect("overview"); onClose(); }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 18,
                color: "var(--color-accent)",
                fontWeight: 400,
                letterSpacing: "0.12em",
                cursor: "pointer",
              }}
              aria-label="Go to workspace overview"
            >
              mnemo
            </button>
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
            {repos.map((repo) => {
              const repoNameString = typeof repo === "string" ? repo : repo.fullName;
              return (
                <li key={repoNameString}>
                  <button
                    className="btn-press"
                    onClick={() => {
                      onRepoSelect(repoNameString);
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
                        repoNameString === activeRepo
                          ? "var(--color-accent)"
                          : "var(--color-ink-dim)",
                      textAlign: "left",
                    }}
                  >
                    {repoNameString}
                  </button>
                </li>
              );
            })}
            {onAddRepoClick && (
              <li style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    onAddRepoClick();
                    onClose();
                  }}
                  className="font-mono btn-press"
                  style={{
                    background: "transparent",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius)",
                    padding: "8px 0",
                    width: "100%",
                    color: "var(--color-ink-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  + MANAGE REPOS
                </button>
              </li>
            )}
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
