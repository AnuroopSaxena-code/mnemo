import { NextResponse } from "next/server";
import { verifyDiscordSignature, formatDiscordResponse } from "@/lib/discord";
import { answerQuestion } from "@/lib/answer";
import { retainDecision } from "@/lib/retain";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!verifyDiscordSignature(process.env.DISCORD_PUBLIC_KEY, signature, timestamp, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Type 1: PING (Handshake verification)
  if (payload.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Type 2: APPLICATION_COMMAND (Slash command interactions)
  if (payload.type === 2) {
    const commandName = payload.data?.name;
    const options = payload.data?.options || [];
    const user = payload.member?.user || payload.user;
    const username = user?.username || "unknown";

    if (commandName === "why") {
      const topic = options.find((o: any) => o.name === "topic")?.value || "";

      try {
        const ans = await answerQuestion(topic, true);
        const formatted = formatDiscordResponse(ans);
        return NextResponse.json({
          type: 4,
          data: { content: formatted }
        });
      } catch (err) {
        console.error("Discord /why lookup failed:", err);
        return NextResponse.json({
          type: 4,
          data: { content: "⚠️ Failed to query Mnemo memories." }
        });
      }
    }

    if (commandName === "remember") {
      const text = options.find((o: any) => o.name === "text")?.value || "";

      try {
        const source = `Discord command by @${username}`;
        const result = await retainDecision(text, "discord", source);
        const responseText = `💾 **Decision retained to Mnemo memory!**\n*ID:* \`${result.record.id}\`\n*Title:* ${result.record.title}`;
        return NextResponse.json({
          type: 4,
          data: { content: responseText }
        });
      } catch (err) {
        console.error("Discord /remember retention failed:", err);
        return NextResponse.json({
          type: 4,
          data: { content: "⚠️ Failed to retain decision." }
        });
      }
    }
  }

  return NextResponse.json({ error: "Interaction type not supported." }, { status: 400 });
}
