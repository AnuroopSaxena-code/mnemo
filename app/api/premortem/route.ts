import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePremortem } from "@/lib/premortem";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  rawText: z.string().min(5),
  sourceType: z.enum(["github", "slack", "adr", "manual", "seed"]).default("manual"),
  bankId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    
    // Resolve workspace bankId from session cookie or payload
    let targetBankId = body.bankId;
    if (!targetBankId) {
      const session = getSession(request.headers.get("cookie"));
      if (session) {
        const workspace = await db.workspace.findUnique({
          where: { id: session.workspaceId }
        });
        if (workspace) {
          targetBankId = workspace.hindsightBankId;
        }
      }
    }

    const result = await generatePremortem(body.rawText, body.sourceType, targetBankId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate pre-mortem." },
      { status: 400 }
    );
  }
}
