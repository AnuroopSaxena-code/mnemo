import fs from "fs/promises";
import path from "path";
import type { DecisionRecord } from "@/lib/types";
import { seedDecisions } from "@/lib/seed-decisions";

const dataDir = path.join(process.cwd(), ".mnemo-data");
const memoryFile = path.join(dataDir, "retained-decisions.json");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readLocalDecisions(): Promise<DecisionRecord[]> {
  try {
    const raw = await fs.readFile(memoryFile, "utf8");
    const retained = JSON.parse(raw) as DecisionRecord[];
    const byId = new Map<string, DecisionRecord>();
    for (const decision of [...seedDecisions, ...retained]) byId.set(decision.id, decision);
    return [...byId.values()];
  } catch {
    return seedDecisions;
  }
}

export async function retainLocalDecision(decision: DecisionRecord) {
  await ensureDataDir();
  const current = (await readLocalDecisions()).filter((item) => !seedDecisions.some((seed) => seed.id === item.id));
  const next = [decision, ...current.filter((item) => item.id !== decision.id)];
  await fs.writeFile(memoryFile, JSON.stringify(next, null, 2));
}
