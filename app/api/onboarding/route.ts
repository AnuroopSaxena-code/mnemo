import { NextResponse } from "next/server";
import { z } from "zod";
import type { OnboardingBrief } from "@/lib/types";
import { recallRelevantMemories } from "@/lib/recall";

const schema = z.object({
  service: z.string().min(2)
});

export async function POST(request: Request) {
  try {
    const { service } = schema.parse(await request.json());
    const { memories, operations } = await recallRelevantMemories(
      `What decisions should a new engineer know before working on ${service}?`,
      { topK: 8 }
    );
    const brief: OnboardingBrief = {
      service,
      summary: `Before touching ${service}, review these decisions because they encode the team's scars, reversals, and caveats.`,
      decisions: memories.map((memory) => ({
        title: memory.record?.title || memory.text.slice(0, 90),
        whyItMatters: memory.record?.rationale || memory.text,
        health: memory.health || { label: "Watch", score: 55, reasons: ["Imported from recalled Hindsight memory."] },
        source: memory.source || memory.id
      })),
      operations
    };
    return NextResponse.json(brief);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create onboarding brief." }, { status: 400 });
  }
}
