import { differenceInMonths, parseISO } from "date-fns";
import type { DecisionHealth, DecisionRecord, RecalledMemory } from "@/lib/types";

export function scoreDecisionHealth(decision: DecisionRecord): DecisionHealth {
  const ageMonths = Math.max(0, differenceInMonths(new Date(), parseISO(decision.date)));
  let score = 92;
  const reasons: string[] = [];

  if (decision.state === "reversed") {
    score -= 48;
    reasons.push("This decision was explicitly reversed.");
  }
  if (decision.state === "stale") {
    score -= 34;
    reasons.push("The decision has an expiry or revisit condition that may be stale.");
  }
  if (ageMonths > 18) {
    score -= 18;
    reasons.push("The decision is more than 18 months old.");
  } else if (ageMonths > 9) {
    score -= 8;
    reasons.push("The decision is old enough to re-check assumptions.");
  }
  if (decision.authorStatus === "left") {
    score -= 10;
    reasons.push("At least one decision owner has left the company.");
  }
  if (decision.reinforcementCount >= 5) {
    score += 10;
    reasons.push("Repeated references have reinforced this decision.");
  } else if (decision.reinforcementCount === 0) {
    score -= 8;
    reasons.push("No later references reinforce this decision.");
  }
  if (decision.caveats.length > 0) {
    score -= Math.min(8, decision.caveats.length * 3);
    reasons.push("The decision has caveats that should be checked before reuse.");
  }

  const bounded = Math.max(0, Math.min(100, score));
  const label =
    decision.state === "reversed" ? "Reversed" : bounded < 42 ? "Stale" : bounded < 72 ? "Watch" : "Healthy";

  return { label, score: bounded, reasons };
}

export function aggregateHealth(memories: RecalledMemory[]): DecisionHealth {
  const healths = memories.map((memory) => memory.health).filter(Boolean) as DecisionHealth[];
  if (healths.length === 0) {
    return {
      label: "Watch",
      score: 55,
      reasons: ["No strong prior decision was found, so the proposal needs normal review."]
    };
  }

  const worst = healths.reduce((a, b) => (a.score < b.score ? a : b));
  const hasReversed = healths.some((health) => health.label === "Reversed");
  return {
    label: hasReversed ? "Reversed" : worst.label,
    score: worst.score,
    reasons: [...new Set(healths.flatMap((health) => health.reasons))].slice(0, 4)
  };
}
