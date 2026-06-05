import crypto from "crypto";

export function verifyTwilioSignature(
  authToken: string | undefined,
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  if (!authToken) return true; // Bypass signature check if not configured in dev
  if (!signature) return false;

  // Sort parameter keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  let baseString = url;

  for (const key of sortedKeys) {
    baseString += key + params[key];
  }

  const computedSignature = crypto
    .createHmac("sha1", authToken)
    .update(baseString)
    .digest("base64");

  return computedSignature === signature;
}

export async function sendWhatsAppReply(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER; // Must be in the format 'whatsapp:+14155238886'

  if (!accountSid || !authToken || !from) {
    console.warn("Twilio credentials not fully configured; skipping WhatsApp dispatch.");
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const formData = new URLSearchParams();
  formData.append("From", from);
  formData.append("To", to);
  formData.append("Body", body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Twilio REST API error: ${res.status} ${errorText}`);
  }
}
