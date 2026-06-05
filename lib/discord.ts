import nacl from "tweetnacl";
import type { ChatAnswer } from "@/lib/types";

export function verifyDiscordSignature(
  publicKey: string | undefined,
  signature: string | null,
  timestamp: string | null,
  body: string
): boolean {
  if (!publicKey) return true; // Bypass signature check if not configured in dev
  if (!signature || !timestamp) return false;

  try {
    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body, "utf-8"),
      Buffer.from(signature, "hex"),
      Buffer.from(publicKey, "hex")
    );
    return isVerified;
  } catch (err) {
    console.error("Discord signature verification error:", err);
    return false;
  }
}

export function formatDiscordResponse(answer: ChatAnswer): string {
  let content = `🧠 **Mnemo Context Synthesis**\n\n${answer.answer}\n\n`;

  if (answer.decision) {
    content += `**Core Decision:** ${answer.decision}\n`;
  }
  if (answer.rationale) {
    content += `**Rationale:** ${answer.rationale}\n`;
  }
  if (answer.evidence && answer.evidence.length > 0) {
    content += `\n**References:**\n`;
    answer.evidence.slice(0, 3).forEach((ev) => {
      content += `* [\`${ev.id}\`] (${ev.source}): _"${ev.text.substring(0, 80)}..."_\n`;
    });
  }

  return content;
}
