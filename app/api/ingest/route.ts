import { NextResponse } from "next/server";
import { z } from "zod";
import { retainDecision } from "@/lib/retain";

const schema = z.object({
  rawText: z.string().min(5),
  sourceType: z.enum(["github", "slack", "discord", "whatsapp", "adr", "manual", "seed"]).default("manual"),
  source: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await retainDecision(body.rawText, body.sourceType, body.source || "Manual review");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retain decision." }, { status: 400 });
  }
}
