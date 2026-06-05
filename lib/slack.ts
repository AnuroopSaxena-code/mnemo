import crypto from "crypto";

export function verifySlackSignature(
  secret: string | undefined,
  body: string,
  timestamp: string | null,
  signature: string | null
): boolean {
  if (!secret) return true; // Bypass signature check if not configured in dev
  if (!timestamp || !signature) return false;

  // Prevent replay attacks (5 minute threshold)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 300) {
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${body}`;
  const computedSignature = "v0=" + crypto
    .createHmac("sha256", secret)
    .update(sigBaseString)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch (err) {
    return false;
  }
}

export async function postSlackMessage(
  token: string | undefined,
  channel: string,
  text: string,
  threadTs?: string
): Promise<void> {
  if (!token) {
    console.warn("Slack bot token not configured; skipping message dispatch.");
    return;
  }

  const url = "https://slack.com/api/chat.postMessage";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      channel,
      text,
      thread_ts: threadTs
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Slack chat.postMessage failed: ${res.status} ${errorText}`);
  } else {
    const data = await res.json();
    if (!data.ok) {
      console.error(`Slack API error: ${data.error}`);
    }
  }
}
