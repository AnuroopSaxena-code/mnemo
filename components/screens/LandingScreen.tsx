"use client";

import { motion } from "framer-motion";

interface LandingScreenProps {
  onConnect: () => void;
}

/* Ticker fragments — real-looking engineering decisions, truncated at ~60 chars */
const TICKER_LEFT = [
  "switched to SQS \u00b7 billing-service \u00b7 8mo ago",
  "rejected GraphQL federation \u00b7 api-gateway \u00b7 1y ago",
  "denormalized user_events table \u00b7 analytics \u00b7 6mo ago",
  "moved auth to gateway layer \u00b7 platform \u00b7 14mo ago",
  "dropped Redis sessions for JWTs \u00b7 auth \u00b7 11mo ago",
  "chose Postgres over DynamoDB \u00b7 billing \u00b7 2y ago",
  "reverted Kafka migration \u00b7 events \u00b7 9mo ago",
  "added circuit breaker to payments \u00b7 infra \u00b7 5mo ago",
  "switched from REST to gRPC \u00b7 internal \u00b7 18mo ago",
  "removed feature flag service \u00b7 platform \u00b7 7mo ago",
];

const TICKER_RIGHT = [
  "parallel CI disabled after flaky runs \u00b7 devops \u00b7 3mo ago",
  "enforced semver on SDK releases \u00b7 sdk \u00b7 10mo ago",
  "rejected monorepo migration \u00b7 all \u00b7 1y ago",
  "added rate limiting at edge \u00b7 api-gateway \u00b7 4mo ago",
  "sunset legacy webhook system \u00b7 integrations \u00b7 6mo",
  "chose Terraform over Pulumi \u00b7 infra \u00b7 2y ago",
  "mandatory ADR for schema changes \u00b7 data \u00b7 8mo ago",
  "split user table by region \u00b7 database \u00b7 12mo ago",
  "rejected server components \u00b7 frontend \u00b7 5mo ago",
  "moved to event sourcing \u00b7 orders \u00b7 15mo ago",
];

export function LandingScreen({ onConnect }: LandingScreenProps) {
  return (
    <motion.section
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-bg)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      exit={{
        scale: 1.08,
        opacity: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {/* Gradient mesh background — three drifting amber nodes */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <div className="mesh-node mesh-node-1" />
        <div className="mesh-node mesh-node-2" />
        <div className="mesh-node mesh-node-3" />
      </div>

      {/* Content — centered stack */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "640px",
          width: "100%",
          padding: "0 24px",
        }}
      >
        {/* Wordmark */}
        <motion.h1
          className="font-display"
          style={{
            fontSize: "clamp(56px, 10vw, 88px)",
            color: "var(--color-ink)",
            letterSpacing: "0.18em",
            fontWeight: 400,
            margin: 0,
            lineHeight: 1,
            textAlign: "center",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          m n e m o
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="font-mono"
          style={{
            fontSize: 13,
            color: "var(--color-ink-muted)",
            marginTop: 24,
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          your codebase has been trying to warn you
        </motion.p>

        {/* Amber line draw */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.1 }}
          style={{ marginTop: 32 }}
        >
          <div className="amber-line-draw" style={{ animationDelay: "0.7s" }} />
        </motion.div>

        {/* Scrolling decision fragments ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          style={{
            marginTop: 32,
            display: "flex",
            gap: 32,
            height: 140,
            overflow: "hidden",
            width: "100%",
            maskImage:
              "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          }}
        >
          {/* Left column — scrolls up */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div className="ticker-column">
              {[...TICKER_LEFT, ...TICKER_LEFT].map((frag, i) => (
                <p
                  key={`l-${i}`}
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-ink-ghost)",
                    margin: 0,
                    padding: "6px 0",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {frag}
                </p>
              ))}
            </div>
          </div>

          {/* Right column — scrolls down (reverse) */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div className="ticker-column-reverse">
              {[...TICKER_RIGHT, ...TICKER_RIGHT].map((frag, i) => (
                <p
                  key={`r-${i}`}
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-ink-ghost)",
                    margin: 0,
                    padding: "6px 0",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {frag}
                </p>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          style={{ marginTop: 40 }}
        >
          <button
            id="connect-repo-cta"
            className="cta-outlined btn-press"
            onClick={onConnect}
          >
            login with github →
          </button>
        </motion.div>
      </div>

      {/* Footer text */}
      <motion.footer
        className="font-mono"
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 10,
          color: "var(--color-ink-ghost)",
          letterSpacing: "0.06em",
          textAlign: "center",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        institutional memory for engineering teams
      </motion.footer>
    </motion.section>
  );
}
