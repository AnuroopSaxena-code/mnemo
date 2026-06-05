"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NoiseBackground } from "@/components/ui/NoiseBackground";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { ConnectRepoModal } from "@/components/screens/ConnectRepoModal";
import { WorkspaceScreen } from "@/components/screens/WorkspaceScreen";
import type { DecisionRecord } from "@/lib/types";

type AppScreen = "landing" | "connecting" | "workspace";

interface MnemoAppProps {
  initialDecisions: DecisionRecord[];
}

export function MnemoApp({ initialDecisions }: MnemoAppProps) {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [repoName, setRepoName] = useState("acme-devtools");

  function handleConnect() {
    setScreen("connecting");
  }

  function handleConnected(name: string) {
    setRepoName(name);
    setScreen("workspace");
  }

  return (
    <>
      <NoiseBackground />

      <AnimatePresence mode="wait">
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
