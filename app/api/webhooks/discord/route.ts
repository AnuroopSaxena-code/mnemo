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
    const interactionToken = payload.token;
    const applicationId = payload.application_id || process.env.DISCORD_APPLICATION_ID;

    const user = payload.member?.user || payload.user;
    const username = user?.username || "unknown";

    if (commandName === "why") {
      const topic = options.find((o: any) => o.name === "topic")?.value || "";

      // Asynchronous deferred reply
      (async () => {
        try {
          const ans = await answerQuestion(topic, true);
          const formatted = formatDiscordResponse(ans);

          await fetch(
            `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: formatted })
            }
          );
        } catch (err) {
          console.error("Discord /why deferred answer processing failed:", err);
          await fetch(
            `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: "⚠️ Failed to query Mnemo memories." })
            }
          );
        }
      })();

      // Type 5: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE (gives us 15 minutes to reply via PATCH)
      return NextResponse.json({ type: 5 });
    }

    if (commandName === "remember") {
      const text = options.find((o: any) => o.name === "text")?.value || "";

      (async () => {
        try {
          const source = `Discord command by @${username}`;
          const result = await retainDecision(text, "discord", source);
          const responseText = `💾 **Decision retained to Mnemo memory!**\n*ID:* \`${result.record.id}\`\n*Title:* ${result.record.title}`;

          await fetch(
            `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: responseText })
            }
          );
        } catch (err) {
          console.error("Discord /remember deferred retention processing failed:", err);
        }
      })();

      // Type 5: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      return NextResponse.json({ type: 5 });
    }
  }

  return NextResponse.json({ error: "Interaction type not supported." }, { status: 400 });
}
