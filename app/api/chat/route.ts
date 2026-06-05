import { NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/lib/answer";

const schema = z.object({
  question: z.string().min(3),
  useMemory: z.boolean().default(true)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await answerQuestion(body.question, body.useMemory);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to answer question." }, { status: 400 });
  }
}
