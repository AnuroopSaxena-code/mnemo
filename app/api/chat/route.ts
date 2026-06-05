import { NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/lib/answer";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  question: z.string().min(3),
  useMemory: z.boolean().default(true),
  bankId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    
    // Resolve the active workspace bankId from session cookie or fallback to default
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

    const result = await answerQuestion(body.question, body.useMemory, targetBankId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to answer question." }, 
      { status: 400 }
    );
  }
}
