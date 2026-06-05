import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePremortem } from "@/lib/premortem";

const schema = z.object({
  rawText: z.string().min(5),
  sourceType: z.enum(["github", "slack", "adr", "manual", "seed"]).default("manual")
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await generatePremortem(body.rawText, body.sourceType);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate pre-mortem." },
      { status: 400 }
    );
  }
}
