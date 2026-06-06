"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

interface ConnectSocialsTabProps {
  authInfo?: any;
  onRefreshAuth?: () => void;
}

export function ConnectSocialsTab({ authInfo, onRefreshAuth }: ConnectSocialsTabProps) {
  const [discordUsername, setDiscordUsername] = useState("");
  const [guildName, setGuildName] = useState("");
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDiscordLinked = !!authInfo?.user?.discordId;
  const linkedUsername = authInfo?.user?.discordUsername || "";
  const linkedDiscordId = authInfo?.user?.discordId || "";

  // Filter integrations for discord
  const discordInstallations = authInfo?.integrations?.filter(
    (i: any) => i.platform === "discord"
  ) || [];

  async function handleLink() {
    if (!discordUsername.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const mockId = `discord_usr_${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await fetch("/api/auth/discord/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: mockId, discordUsername: discordUsername.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link account");
      
      setDiscordUsername("");
      if (onRefreshAuth) onRefreshAuth();
    } catch (err: any) {
      setError(err.message || "Failed to link Discord account");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/discord/unlink", {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlink account");
      if (onRefreshAuth) onRefreshAuth();
    } catch (err: any) {
      setError(err.message || "Failed to unlink Discord account");
    } finally {
      setLoading(false);
    }
  }

  async function handleInstallBot() {
    if (!guildName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const mockGuildId = `guild_${Math.floor(10000000 + Math.random() * 90000000)}`;
      const res = await fetch("/api/workspace/discord/bot-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId: mockGuildId, guildName: guildName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to install bot");
      
      setGuildName("");
      setShowInstallForm(false);
      if (onRefreshAuth) onRefreshAuth();
    } catch (err: any) {
      setError(err.message || "Failed to install bot");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "48px 48px 80px",
        display: "flex",
        flexDirection: "column",
        gap: "56px",
        maxWidth: "1400px",
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
        style={{ display: "flex", flexDirection: "column", gap: "32px" }}
      >
        {/* DISCORD CARD */}
        <article
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "36px 40px",
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* Left: info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "#5865F2" }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width={32} height={32}>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <h2
                  className="font-mono"
                  style={{ fontSize: "18px", color: "var(--color-ink)", margin: 0, fontWeight: 500 }}
                >
                  Discord Bot
                </h2>
                <span className="font-mono" style={{ fontSize: "11px", color: "#5865F2" }}>
                  Surface memory in your engineering channels
                </span>
              </div>
            </div>

            <p
              className="font-body"
              style={{
                fontSize: "13px",
                color: "var(--color-ink-dim)",
                margin: 0,
                lineHeight: 1.75,
                maxWidth: "600px",
              }}
            >
              Connect Mnemo to your Discord server and query architectural decisions directly inside chat. 
              Run pre-mortems, retrieve onboarding briefs, and receive automated alerts on stale/reversed decisions.
            </p>

            {/* Command List Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Bot Commands & Integrations
              </span>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-dim)", display: "flex", alignItems: "start", gap: "10px" }}>
                  <span style={{ color: "var(--color-accent)" }}>›</span>
                  <div>
                    <strong>/set-repo [repo]</strong> — Choose your active repository context (with live autocomplete).
                  </div>
                </li>
                <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-dim)", display: "flex", alignItems: "start", gap: "10px" }}>
                  <span style={{ color: "var(--color-accent)" }}>›</span>
                  <div>
                    <strong>/mnemo [question]</strong> — Ask Mnemo natural language questions about codebase history.
                  </div>
                </li>
                <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-dim)", display: "flex", alignItems: "start", gap: "10px" }}>
                  <span style={{ color: "var(--color-accent)" }}>›</span>
                  <div>
                    <strong>/premortem [details]</strong> — Setup changes for pre-merge risk checks and button-triggered analyses.
                  </div>
                </li>
                <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-dim)", display: "flex", alignItems: "start", gap: "10px" }}>
                  <span style={{ color: "var(--color-accent)" }}>›</span>
                  <div>
                    <strong>/onboarding [service]</strong> — Generate technical briefs dynamically for service onboarding.
                  </div>
                </li>
                <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-dim)", display: "flex", alignItems: "start", gap: "10px" }}>
                  <span style={{ color: "var(--color-accent)" }}>›</span>
                  <div>
                    <strong>Automated Status Alerts</strong> — Get real-time alert logs in chat whenever a decision is marked <strong>reversed</strong> or <strong>stale</strong>.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Connect Control */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              background: "var(--color-surface-2)",
              padding: "24px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Discord Settings
            </span>

            {error && (
              <p className="font-mono" style={{ fontSize: "11px", color: "var(--color-error)", margin: 0 }}>
                {error}
              </p>
            )}

            {/* Link/Unlink section */}
            {!isDiscordLinked ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-dim)" }}>
                  Link Discord Account
                </span>
                <input
                  type="text"
                  placeholder="Discord username (@handle)"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-ink)",
                    padding: "8px 12px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    width: "100%",
                    outline: "none",
                  }}
                />
                <button
                  className="font-mono btn-press"
                  disabled={loading || !discordUsername.trim()}
                  onClick={handleLink}
                  style={{
                    background: "var(--color-accent)",
                    border: "none",
                    color: "var(--color-bg)",
                    padding: "8px 16px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: loading || !discordUsername.trim() ? "not-allowed" : "pointer",
                    width: "100%",
                  }}
                >
                  Link Account
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>
                    Linked Account
                  </span>
                  <span className="font-mono" style={{ fontSize: "13px", color: "var(--color-accent)" }}>
                    @{linkedUsername}
                  </span>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-ghost)" }}>
                    ID: {linkedDiscordId}
                  </span>
                </div>
                <button
                  className="font-mono btn-press"
                  disabled={loading}
                  onClick={handleUnlink}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-ink-muted)",
                    padding: "6px 12px",
                    fontSize: "11px",
                    cursor: loading ? "not-allowed" : "pointer",
                    width: "100%",
                  }}
                >
                  Unlink Account
                </button>

                <div style={{ borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

                {/* Servers Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span className="font-mono" style={{ fontSize: "9px", color: "var(--color-ink-muted)", textTransform: "uppercase" }}>
                    Connected Servers ({discordInstallations.length})
                  </span>
                  {discordInstallations.map((inst: any) => (
                    <div key={inst.id} className="font-mono" style={{ fontSize: "11px", color: "var(--color-ink-dim)" }}>
                      🟢 {inst.guildName || `Guild: ${inst.platformId.substring(0, 8)}`}
                    </div>
                  ))}

                  {!showInstallForm ? (
                    <button
                      className="font-mono btn-press"
                      onClick={() => setShowInstallForm(true)}
                      style={{
                        background: "rgba(201, 168, 76, 0.1)",
                        border: "1px dashed var(--color-accent)",
                        color: "var(--color-accent)",
                        padding: "8px 12px",
                        fontSize: "11px",
                        cursor: "pointer",
                        width: "100%",
                        marginTop: 4,
                      }}
                    >
                      + Add Bot to Server
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: 4 }}>
                      <input
                        type="text"
                        placeholder="Server (Guild) Name"
                        value={guildName}
                        onChange={(e) => setGuildName(e.target.value)}
                        style={{
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-ink)",
                          padding: "6px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="font-mono btn-press"
                          disabled={loading || !guildName.trim()}
                          onClick={handleInstallBot}
                          style={{
                            background: "var(--color-accent)",
                            border: "none",
                            color: "var(--color-bg)",
                            padding: "6px 12px",
                            fontSize: "10px",
                            fontWeight: 600,
                            cursor: loading || !guildName.trim() ? "not-allowed" : "pointer",
                            flex: 1,
                          }}
                        >
                          Simulate
                        </button>
                        <a
                          href="https://discord.com/oauth2/authorize?client_id=1512396495398113300&permissions=8&scope=bot%20applications.commands"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono btn-press"
                          style={{
                            background: "transparent",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-ink)",
                            padding: "6px 12px",
                            fontSize: "10px",
                            textAlign: "center",
                            textDecoration: "none",
                            flex: 1,
                          }}
                        >
                          Authorize
                        </a>
                      </div>
                      <button
                        className="font-mono"
                        onClick={() => setShowInstallForm(false)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--color-ink-muted)",
                          fontSize: "10px",
                          cursor: "pointer",
                          alignSelf: "flex-start",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* SLACK CARD (COMING SOON) */}
        <article
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "36px 40px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "32px",
            alignItems: "start",
            opacity: 0.6,
          }}
        >
          {/* Left: info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "#4A154B" }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width={32} height={32}>
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                </svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <h2
                  className="font-mono"
                  style={{ fontSize: "18px", color: "var(--color-ink)", margin: 0, fontWeight: 500 }}
                >
                  Slack App
                </h2>
                <span className="font-mono" style={{ fontSize: "11px", color: "#4A154B" }}>
                  Bring institutional memory into your workspace
                </span>
              </div>
            </div>

            <p
              className="font-body"
              style={{
                fontSize: "13px",
                color: "var(--color-ink-dim)",
                margin: 0,
                lineHeight: 1.75,
                maxWidth: "600px",
              }}
            >
              Install the Mnemo Slack app and let engineers ask questions in any channel. Get context on past decisions, 
              flag risky PRs, and onboard new teammates — all without leaving Slack.
            </p>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "var(--color-accent)" }}>›</span>
                Natural language memory queries in any channel
              </li>
              <li className="font-mono" style={{ fontSize: "12px", color: "var(--color-ink-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "var(--color-accent)" }}>›</span>
                Thread replies with cited decision sources
              </li>
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
                border: "1px solid var(--color-border)",
                color: "var(--color-ink-muted)",
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
              Connect Slack
            </button>
            <span
              className="font-mono"
              style={{ fontSize: "10px", color: "var(--color-ink-ghost)", textAlign: "right" }}
            >
              Coming Soon
            </span>
          </div>
        </article>
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
