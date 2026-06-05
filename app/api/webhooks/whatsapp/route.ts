import { NextResponse } from "next/server";
import { verifyTwilioSignature, sendWhatsAppReply } from "@/lib/twilio";
import { answerQuestion } from "@/lib/answer";
import { retainDecision } from "@/lib/retain";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");

  // Reconstruct the request's public facing URL (essential for Twilio signature validation behind reverse proxies)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const path = new URL(request.url).pathname + new URL(request.url).search;
  const publicUrl = `${proto}://${host}${path}`;

  // Parse application/x-www-form-urlencoded params
  const params: Record<string, string> = {};
  new URLSearchParams(rawBody).forEach((val, key) => {
    params[key] = val;
  });

  if (!verifyTwilioSignature(process.env.TWILIO_AUTH_TOKEN, publicUrl, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const messageText = params.Body || "";
  const fromNumber = params.From || ""; // e.g. whatsapp:+1234567890
  const senderName = params.ProfileName || fromNumber;
  const source = `WhatsApp from ${senderName}`;

  const cleanText = messageText.trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Trigger hashtag: #why [topic]
  if (lowerText.startsWith("#why ")) {
    const query = cleanText.substring(5).trim();
    
    (async () => {
      try {
        const ans = await answerQuestion(query, true);
        let replyText = `🧠 *Mnemo Context Synthesis*\n\n${ans.answer}`;
        if (ans.decision) replyText += `\n\n*Core Decision:* ${ans.decision}`;
        if (ans.rationale) replyText += `\n*Rationale:* ${ans.rationale}`;
        
        await sendWhatsAppReply(fromNumber, replyText);
      } catch (err) {
        console.error("WhatsApp #why processing failed:", err);
      }
    })();

    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" }
    });
  }

  // 2. Trigger hashtag: #decision [content]
  if (lowerText.includes("#decision")) {
    const content = cleanText.replace(/#decision/gi, "").trim();

    (async () => {
      try {
        const result = await retainDecision(content, "whatsapp", source);
        const replyText = `🧠 *Decision Retained to Mnemo!*\n\n*ID:* \`${result.record.id}\`\n*Title:* ${result.record.title}`;
        await sendWhatsAppReply(fromNumber, replyText);
      } catch (err) {
        console.error("WhatsApp #decision processing failed:", err);
      }
    })();

    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" }
    });
  }

  // 3. Trigger hashtag: #revisit [content]
  if (lowerText.includes("#revisit")) {
    const content = cleanText.replace(/#revisit/gi, "").trim();

    (async () => {
      try {
        // Retain as a revisit lifecycle update
        const result = await retainDecision(content, "whatsapp", source);
        const replyText = `🔄 *Decision Revisit Logged to Mnemo!*\n\n*ID:* \`${result.record.id}\`\n*Title:* ${result.record.title}`;
        await sendWhatsAppReply(fromNumber, replyText);
      } catch (err) {
        console.error("WhatsApp #revisit processing failed:", err);
      }
    })();

    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" }
    });
  }

  // Empty Twilio response so Twilio doesn't complain about invalid TwiML
  return new Response("<Response></Response>", {
    headers: { "Content-Type": "text/xml" }
  });
}
