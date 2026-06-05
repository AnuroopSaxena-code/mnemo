export type DecisionState = "proposed" | "decided" | "reinforced" | "revisited" | "reversed" | "stale";
export type HealthLabel = "Healthy" | "Watch" | "Stale" | "Reversed";
export type WarningLevel = "low" | "medium" | "high" | "critical";
export type SourceType = "github" | "slack" | "discord" | "whatsapp" | "adr" | "manual" | "seed";

export interface DecisionAlternative {
  name: string;
  rejectedBecause: string;
}

export interface DecisionEvent {
  id: string;
  state: DecisionState;
  date: string;
  title: string;
  summary: string;
  source: string;
}

export interface DecisionRecord {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  alternatives: DecisionAlternative[];
  caveats: string[];
  scope: string;
  people: string[];
  date: string;
  state: DecisionState;
  sourceType: SourceType;
  source: string;
  sourceUrl?: string;
  tags: string[];
  reinforcementCount: number;
  authorStatus: "active" | "left" | "unknown";
  lifecycle: DecisionEvent[];
  content: string;
}

export interface DecisionHealth {
  label: HealthLabel;
  score: number;
  reasons: string[];
}

export interface RecalledMemory {
  id: string;
  text: string;
  type?: string;
  context?: string;
  mentionedAt?: string;
  source?: string;
  record?: DecisionRecord;
  health?: DecisionHealth;
}

export interface FailureMode {
  risk: string;
  whyHistorySuggestsIt: string;
  mitigation: string;
  citations: string[];
}

export interface PremortemResult {
  warningLevel: WarningLevel;
  headline: string;
  summary: string;
  failureModes: FailureMode[];
  evidence: RecalledMemory[];
  lifecycle: DecisionEvent[];
  health: DecisionHealth;
  operations: OperationBadge[];
  extraction: ExtractedDecision;
}

export interface ExtractedDecision {
  decision: string;
  rationale: string;
  alternatives: DecisionAlternative[];
  caveats: string[];
  scope: string;
  people: string[];
  date?: string;
  tags: string[];
  lifecycleHint: DecisionState;
}

export interface OperationBadge {
  label: string;
  state: "complete" | "skipped" | "warning" | "error";
  detail: string;
}

export interface ChatAnswer {
  mode: "with-memory" | "without-memory";
  answer: string;
  decision?: string;
  rationale?: string;
  alternatives?: DecisionAlternative[];
  caveats?: string[];
  people?: string[];
  date?: string;
  evidence: RecalledMemory[];
  operations: OperationBadge[];
}

export interface OnboardingBrief {
  service: string;
  summary: string;
  decisions: Array<{
    title: string;
    whyItMatters: string;
    health: DecisionHealth;
    source: string;
  }>;
  operations: OperationBadge[];
}
