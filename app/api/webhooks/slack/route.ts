import { NextResponse } from "next/server";
import { verifySlackSignature, postSlackMessage } from "@/lib/slack";
import { answerQuestion } from "@/lib/answer";
import { retainDecision } from "@/lib/retain";
import { resolveWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { generateId } from "@/lib/crypto";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-slack-signature");
  const timestamp = request.headers.get("x-slack-request-timestamp");

  if (!verifySlackSignature(process.env.SLACK_SIGNING_SECRET, rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  // 1. Handle URL Encoded Body (Slack Slash Commands)
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    const command = params.get("command") || "";
    const text = params.get("text") || "";
    const teamId = params.get("team_id") || "";
    const channelId = params.get("channel_id") || "";
    const userId = params.get("user_id") || "";

    const resolved = await resolveWorkspace("slack", teamId);
    if (!resolved) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "⚠️ Slack team not connected to a Mnemo workspace. Register at mne-mo.vercel.app."
      });
    }

    if (command === "/why" || command === "/mnemo") {
      const token = process.env.SLACK_BOT_TOKEN;

      // Asynchronous lookup to stay within Slack's 3-second response window
      (async () => {
        try {
          const ans = await answerQuestion(text, true, resolved.bankId);
          let formatted = `🧠 *Mnemo Context Synthesis for "${text}"*\n\n${ans.answer}`;
          if (ans.decision) formatted += `\n\n*Core Decision:* ${ans.decision}`;
          if (ans.rationale) formatted += `\n*Rationale:* ${ans.rationale}`;
          await postSlackMessage(token, channelId, formatted);
        } catch (err) {
          console.error("Slack recall error:", err);
        }
      })();

      return NextResponse.json({
        response_type: "ephemeral",
        text: `🧠 Querying Mnemo memory for "${text}"...`
      });
    }

    if (command === "/remember" || command === "/mnemo-store") {
      const token = process.env.SLACK_BOT_TOKEN;

      (async () => {
        try {
          const source = `Slack command by <@${userId}>`;
          const result = await retainDecision(text, "slack", source, resolved.bankId);
          
          await db.decision.create({
            data: {
              id: generateId("dec"),
              workspaceId: resolved.workspaceId,
              hindsightId: result.record.id,
              title: result.record.title,
              decision: result.record.decision,
              rationale: result.record.rationale || "",
              alternatives: JSON.stringify(result.record.alternatives || []),
              caveats: (result.record.caveats || []).join(", "),
              scope: result.record.scope || "",
              people: (result.record.people || []).join(", "),
              source: "slack",
              state: result.record.state
            }
          });

          const reply = `💾 *Decision retained to Mnemo memory!*\n*ID:* \`${result.record.id}\`\n*Extracted Decision:* ${result.record.title}`;
          await postSlackMessage(token, channelId, reply);
        } catch (err) {
          console.error("Slack remember error:", err);
        }
      })();

      return NextResponse.json({
        response_type: "ephemeral",
        text: `💾 Retaining decision to Mnemo: "${text.substring(0, 50)}..."`
      });
    }

    return NextResponse.json({ text: "Command not supported." });
  }

  // 2. Handle JSON Body (Slack Events API)
  const payload = JSON.parse(rawBody);

  // Handle URL Verification handshake
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  if (payload.type === "event_callback") {
    const event = payload.event;
    if (!event) return NextResponse.json({ ok: true });

    const channel = event.channel;
    const threadTs = event.thread_ts || event.ts;
    const userId = event.user;
    const teamId = payload.team_id || "";

    // Avoid responding to bot messages or self-mentions
    if (event.bot_id || event.user === payload.authorizations?.[0]?.user_id) {
      return NextResponse.json({ ok: true });
    }

    const resolved = await resolveWorkspace("slack", teamId);
    if (!resolved) return NextResponse.json({ ok: true });

    const isMention = event.type === "app_mention";
    const text: string = event.text || "";
    const token = process.env.SLACK_BOT_TOKEN;

    // Option A: Bot Tag Mention
    if (isMention) {
      const cleanQuery = text.replace(/<@[A-Z0-9]+>/g, "").trim();

      (async () => {
        try {
          const ans = await answerQuestion(cleanQuery, true, resolved.bankId);
          let formatted = `🧠 *Mnemo Context Synthesis*\n\n${ans.answer}`;
          if (ans.decision) formatted += `\n\n*Core Decision:* ${ans.decision}`;
          if (ans.rationale) formatted += `\n*Rationale:* ${ans.rationale}`;
          await postSlackMessage(token, channel, formatted, threadTs);
        } catch (err) {
          console.error("Slack mention error:", err);
        }
      })();

      return NextResponse.json({ ok: true });
    }

    // Option B: Inline #decision tag
    if (text.includes("#decision")) {
      const cleanText = text.replace(/#decision/g, "").trim();

      (async () => {
        try {
          const source = `Slack channel <#${channel}> message by <@${userId}>`;
          const result = await retainDecision(cleanText, "slack", source, resolved.bankId);
          
          await db.decision.create({
            data: {
              id: generateId("dec"),
              workspaceId: resolved.workspaceId,
              hindsightId: result.record.id,
              title: result.record.title,
              decision: result.record.decision,
              rationale: result.record.rationale || "",
              alternatives: JSON.stringify(result.record.alternatives || []),
              caveats: (result.record.caveats || []).join(", "),
              scope: result.record.scope || "",
              people: (result.record.people || []).join(", "),
              source: "slack",
              state: result.record.state
            }
          });

          const reply = `💾 *Decision retained to Mnemo memory!*\n*ID:* \`${result.record.id}\`\n*Title:* ${result.record.title}`;
          await postSlackMessage(token, channel, reply, threadTs);
        } catch (err) {
          console.error("Slack inline #decision error:", err);
        }
      })();
    }
  }

  return NextResponse.json({ ok: true });
}
