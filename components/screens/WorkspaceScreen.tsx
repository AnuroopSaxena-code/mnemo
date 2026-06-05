"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, MobileSidebar } from "@/components/workspace/Sidebar";
import { PreMortemTab } from "@/components/workspace/PreMortemTab";
import { AskMemoryTab } from "@/components/workspace/AskMemoryTab";
import { TimelineTab } from "@/components/workspace/TimelineTab";
import { OnboardingTab } from "@/components/workspace/OnboardingTab";
import { SourcesTab } from "@/components/workspace/SourcesTab";
import { DecisionDetailScreen } from "@/components/screens/DecisionDetailScreen";
import { ConnectRepoModal } from "@/components/screens/ConnectRepoModal";
import type { DecisionRecord, SourceType } from "@/lib/types";

interface WorkspaceScreenProps {
  repoName: string;
  decisions: DecisionRecord[];
}

const suggestedQueries = [
  "why is the user_events table denormalized?",
  "why did we move off Kafka?",
  "why is auth handled at the gateway?"
];

type WorkspaceTab = "premortem" | "ask" | "timeline" | "onboarding" | "sources";

export function WorkspaceScreen({ repoName, decisions }: WorkspaceScreenProps) {
  const [activeRepo, setActiveRepo] = useState(repoName);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("premortem");
  const [decisionsList, setDecisionsList] = useState<DecisionRecord[]>(decisions);
  const [dbDecisions, setDbDecisions] = useState<DecisionRecord[]>([]);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  const [detailDecision, setDetailDecision] = useState<DecisionRecord | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );


  // 1. Fetch user workspace and connection status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setAuthInfo(data);
        }
      } catch (err) {
        console.warn("Auth info check failed:", err);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch database-retained decisions
  const fetchDbDecisions = useCallback(async () => {
    try {
      const res = await fetch("/api/decisions");
      if (res.ok) {
        const data = await res.json();
        setDbDecisions(data.decisions);
      }
    } catch (err) {
      console.warn("Failed fetching DB decisions:", err);
    }
  }, []);

  useEffect(() => {
    fetchDbDecisions();
  }, [fetchDbDecisions]);

  // 3. Resolve active repositories and decisions from live data
  const repos = (authInfo?.workspace?.repos && authInfo.workspace.repos.length > 0)
    ? authInfo.workspace.repos
    : [repoName];

  const activeDecisionsList = dbDecisions.length > 0 ? dbDecisions : decisionsList;

  const handleAddDecision = useCallback((newDec: DecisionRecord) => {
    fetchDbDecisions();
  }, [fetchDbDecisions]);



  return (
    <>
      <div
        className="flex"
        style={{ minHeight: "100vh", background: "var(--color-bg)" }}
      >
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar
            repos={repos}
            activeRepo={activeRepo}
            decisionCount={activeDecisionsList.length}
            onRepoSelect={setActiveRepo}
            activeTab={activeTab}
            onTabSelect={(tab) => setActiveTab(tab as WorkspaceTab)}
            authInfo={authInfo}
            onAddRepoClick={() => setShowConnectModal(true)}
          />
        )}

        {/* Mobile Wordmark/Trigger */}
        {isMobile && (
          <button
            className="font-display btn-press"
            onClick={() => setShowMobileSidebar(true)}
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 30,
              background: "transparent",
              border: "none",
              color: "var(--color-accent)",
              fontSize: 16,
              cursor: "pointer",
              letterSpacing: "0.1em"
            }}
          >
            mnemo
          </button>
        )}

        {/* Main Workspace Canvas Area */}
        <main style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            {activeTab === "premortem" && (
              <motion.div
                key="premortem"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PreMortemTab
                  initialProposal={undefined}
                  initialSourceType={undefined}
                  initialSourceDetail={undefined}
                  onDecisionClick={setDetailDecision}
                  onAddDecision={handleAddDecision}
                  showcaseMode={false}
                />
              </motion.div>
            )}

            {activeTab === "ask" && (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AskMemoryTab
                  onDecisionClick={setDetailDecision}
                  suggestedQueries={suggestedQueries}
                  showcaseMode={false}
                />
              </motion.div>
            )}

            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TimelineTab
                  decisions={activeDecisionsList}
                  onDecisionClick={setDetailDecision}
                />
              </motion.div>
            )}

            {activeTab === "onboarding" && (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <OnboardingTab
                  decisions={activeDecisionsList}
                  onDecisionClick={setDetailDecision}
                  showcaseMode={false}
                />
              </motion.div>
            )}

            {activeTab === "sources" && (
              <motion.div
                key="sources"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SourcesTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sidebar bottom sheet drawer */}
      <AnimatePresence>
        {showMobileSidebar && (
          <MobileSidebar
            repos={repos}
            activeRepo={activeRepo}
            decisionCount={activeDecisionsList.length}
            onRepoSelect={setActiveRepo}
            activeTab={activeTab}
            onTabSelect={(tab) => setActiveTab(tab as WorkspaceTab)}
            onClose={() => setShowMobileSidebar(false)}
            authInfo={authInfo}
            onAddRepoClick={() => setShowConnectModal(true)}
          />
        )}
      </AnimatePresence>

      {/* Decision Detail Screen Overlay (Cinematic Drawer) */}
      <AnimatePresence>
        {detailDecision && (
          <DecisionDetailScreen
            decision={detailDecision}
            onBack={() => setDetailDecision(null)}
          />
        )}
      </AnimatePresence>

      {/* Connect Repo Modal Overlay */}
      <AnimatePresence>
        {showConnectModal && (
          <ConnectRepoModal
            onConnected={(name) => {
              setShowConnectModal(false);
              setActiveRepo(name);
              fetchDbDecisions();
              window.location.reload();
            }}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
