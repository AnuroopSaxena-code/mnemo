"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NoiseBackground } from "@/components/ui/NoiseBackground";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { ConnectRepoModal } from "@/components/screens/ConnectRepoModal";
import { WorkspaceScreen } from "@/components/screens/WorkspaceScreen";
import type { DecisionRecord } from "@/lib/types";

type AppScreen = "loading" | "landing" | "connecting" | "workspace";

interface MnemoAppProps {
  initialDecisions: DecisionRecord[];
}

export function MnemoApp({ initialDecisions }: MnemoAppProps) {
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [repoName, setRepoName] = useState("acme-devtools");
  const [authInfo, setAuthInfo] = useState<any>(null);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setAuthInfo(data);
        if (data.authenticated) {
          const connectedRepos = data.workspace?.repos || [];
          if (connectedRepos.length > 0) {
            setRepoName(connectedRepos[0].fullName || connectedRepos[0]);
            setScreen("workspace");
          } else {
            setScreen("connecting");
          }
        } else {
          setScreen("landing");
        }
      } else {
        setScreen("landing");
      }
    } catch (err) {
      console.warn("Auth check failed:", err);
      setScreen("landing");
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  function handleConnect() {
    window.location.href = "/api/auth/login/github";
  }

  function handleConnected(name: string) {
    setRepoName(name);
    checkAuth();
  }

  return (
    <>
      <NoiseBackground />

      <AnimatePresence mode="wait">
        {screen === "loading" && (
          <motion.div
            key="loading"
            className="flex items-center justify-center font-mono"
            style={{ position: "fixed", inset: 0, zIndex: 10, background: "var(--color-bg)", color: "var(--color-accent)", fontSize: 13 }}
            exit={{ opacity: 0 }}
          >
            <div className="blink-cursor">initializing mnemo...</div>
          </motion.div>
        )}

        {screen === "landing" && (
          <LandingScreen key="landing" onConnect={handleConnect} />
        )}

        {screen === "connecting" && (
          <ConnectRepoModal key="connecting" onConnected={handleConnected} />
        )}

        {screen === "workspace" && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "relative", zIndex: 2 }}
          >
            <WorkspaceScreen
              repoName={repoName}
              decisions={initialDecisions}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
