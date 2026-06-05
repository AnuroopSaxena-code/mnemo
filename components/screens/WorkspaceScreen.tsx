"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, MobileSidebar } from "@/components/workspace/Sidebar";
import { PreMortemTab } from "@/components/workspace/PreMortemTab";
import { AskMemoryTab } from "@/components/workspace/AskMemoryTab";
import { TimelineTab } from "@/components/workspace/TimelineTab";
import { OnboardingTab } from "@/components/workspace/OnboardingTab";
import { SourcesTab } from "@/components/workspace/SourcesTab";
import { DecisionDetailScreen } from "@/components/screens/DecisionDetailScreen";
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
  const [detailDecision, setDetailDecision] = useState<DecisionRecord | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Loaded proposal state passed to PreMortemTab when selected from Inbox
  const [loadedProposal, setLoadedProposal] = useState<string | undefined>(undefined);
  const [loadedSourceType, setLoadedSourceType] = useState<SourceType | undefined>(undefined);
  const [loadedSourceDetail, setLoadedSourceDetail] = useState<string | undefined>(undefined);
  const [premortemKey, setPremortemKey] = useState(0);

  const repos = [repoName, "user-auth-gateway", "dashboard-frontend"];

  const handleAddDecision = useCallback((newDec: DecisionRecord) => {
    setDecisionsList((prev) => {
      // Avoid duplicate keys
      if (prev.some((d) => d.id === newDec.id)) return prev;
      return [newDec, ...prev];
    });
  }, []);

  const handleLoadProposal = useCallback((text: string, sourceType: SourceType, sourceDetail: string) => {
    setLoadedProposal(text);
    setLoadedSourceType(sourceType);
    setLoadedSourceDetail(sourceDetail);
    setPremortemKey((prev) => prev + 1);
    setActiveTab("premortem");
  }, []);

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
            decisionCount={decisionsList.length}
            onRepoSelect={setActiveRepo}
            activeTab={activeTab}
            onTabSelect={(tab) => setActiveTab(tab as WorkspaceTab)}
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
                key={`premortem-${premortemKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PreMortemTab
                  initialProposal={loadedProposal}
                  initialSourceType={loadedSourceType}
                  initialSourceDetail={loadedSourceDetail}
                  onDecisionClick={setDetailDecision}
                  onAddDecision={handleAddDecision}
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
                  decisions={decisionsList}
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
                  decisions={decisionsList}
                  onDecisionClick={setDetailDecision}
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
                <SourcesTab onLoadProposal={handleLoadProposal} />
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
            decisionCount={decisionsList.length}
            onRepoSelect={setActiveRepo}
            activeTab={activeTab}
            onTabSelect={(tab) => setActiveTab(tab as WorkspaceTab)}
            onClose={() => setShowMobileSidebar(false)}
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
    </>
  );
}
