import type { ChatAnswer } from "@/lib/types";
import { getGroqClient, GROQ_MODEL_CHAT, hasGroqKey } from "@/lib/groq";
import { recallRelevantMemories } from "@/lib/recall";
import { readCache, writeCache } from "@/lib/cache";
import { stableHash } from "@/lib/text";

export async function answerQuestion(question: string, useMemory: boolean): Promise<ChatAnswer> {
  const mode = useMemory ? "with-memory" : "without-memory";
  const cacheKey = `chat-${stableHash(`${mode}:${question}`)}`;
  const cached = await readCache<ChatAnswer>(cacheKey);
  if (cached) return cached;

  if (!useMemory) {
    const answer = await genericAnswer(question);
    const result: ChatAnswer = {
      mode,
      answer,
      evidence: [],
      operations: [
        {
          label: "Hindsight recall",
          state: "skipped",
          detail: "Memory was intentionally disabled for the before/after demo."
        }
      ]
    };
    await writeCache(cacheKey, result);
    return result;
  }

  const { memories, operations } = await recallRelevantMemories(question, { topK: 5 });
  const answer = await synthesizeMemoryAnswer(question, memories);
  const result: ChatAnswer = { mode, ...answer, evidence: memories, operations };
  await writeCache(cacheKey, result);
  return result;
}

async function genericAnswer(question: string) {
  if (hasGroqKey()) {
    const response = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL_CHAT,
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You are a capable but memoryless engineering assistant. You have no access to this team's history, decisions, or past incidents. " +
            "Answer the question using general engineering knowledge only. " +
            "Be honest and upfront: explicitly acknowledge at the start of your answer that you lack this team's specific context. " +
            "Do not invent company-specific history, names, or dates. " +
            "Keep the answer to 3-4 sentences."
        },
        { role: "user", content: question }
      ]
    });
    return response.choices[0]?.message?.content || "Without memory, I can only give general engineering tradeoffs.";
  }
  return "Without memory, I can only give general engineering tradeoffs. I do not know what this team tried, who made the decision, or whether it was later reversed.";
}

/** Build a structured memory context block for the LLM. */
function buildMemoryContext(memories: Awaited<ReturnType<typeof recallRelevantMemories>>["memories"]): string {
  return memories
    .map((memory, index) => {
      const record = memory.record;
      const parts: string[] = [`[MEMORY ${index + 1}: ${memory.id}]`];
      if (record?.state) parts.push(`State: ${record.state}`);
      if (record?.date) parts.push(`Date: ${record.date}`);
      if (record?.people?.length) parts.push(`People: ${record.people.join(", ")}`);
      if (memory.health) parts.push(`Health: ${memory.health.label} (score ${memory.health.score})`);
      return parts.join(" | ") + "\n" + memory.text;
    })
    .join("\n\n---\n\n");
}

const MEMORY_ANSWER_SYSTEM_PROMPT = `You are Mnemo, an institutional memory assistant for an engineering team.
Answer the question using ONLY the recalled memories provided below. Never invent facts.

Response format — return a JSON object with exactly these keys:
{
  "answer": "A narrative paragraph (4-6 sentences) answering the question. Open with the key finding. If any memory has state=reversed, begin with: 'Note: this decision was reversed on [date] — '. Name the people involved and the date when quoting memories. Cite memory IDs in square brackets inline.",
  "decision": "The core decision in one sentence (from the most relevant memory).",
  "rationale": "The rationale from that memory, in full sentences.",
  "alternatives": [{ "name": "...", "rejectedBecause": "..." }],
  "caveats": ["..."],
  "people": ["..."],
  "date": "YYYY-MM-DD"
}

Rules:
- If a recalled memory has state=reversed, the answer MUST open with a reversal notice and name the date.
- Cite memory IDs inline in the answer text using [MEMORY N] format.
- If the memories do not contain a clear answer, say so honestly in the answer field.
- Return raw JSON only — no markdown, no code fences.`;

async function synthesizeMemoryAnswer(question: string, memories: Awaited<ReturnType<typeof recallRelevantMemories>>["memories"]) {
  const fallback = {
    answer:
      memories[0]?.text ||
      "I could not find a relevant retained decision. This should be treated as a fresh question and retained once the team decides.",
    decision: memories[0]?.record?.decision,
    rationale: memories[0]?.record?.rationale,
    alternatives: memories[0]?.record?.alternatives || [],
    caveats: memories[0]?.record?.caveats || [],
    people: memories[0]?.record?.people || [],
    date: memories[0]?.record?.date
  };

  if (!hasGroqKey() || memories.length === 0) return fallback;

  const memoryContext = buildMemoryContext(memories);
  const response = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL_CHAT,
    temperature: 0.1,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: MEMORY_ANSWER_SYSTEM_PROMPT },
      { role: "user", content: `Question: ${question}\n\nRecalled memories:\n${memoryContext}` }
    ]
  });
  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
