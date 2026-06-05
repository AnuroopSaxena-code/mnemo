export interface IntegrationStatus {
  groq: boolean;
  hindsight: boolean;
  github: boolean;
  slack: boolean;
  discord: boolean;
  whatsapp: boolean;
}

export function getIntegrationStatus(): IntegrationStatus {
  return {
    groq: Boolean(process.env.GROQ_API_KEY),
    hindsight: Boolean(process.env.HINDSIGHT_API_KEY),
    github: Boolean(
      process.env.GITHUB_APP_ID &&
      process.env.GITHUB_PRIVATE_KEY &&
      process.env.GITHUB_WEBHOOK_SECRET
    ),
    slack: Boolean(
      process.env.SLACK_BOT_TOKEN &&
      process.env.SLACK_SIGNING_SECRET
    ),
    discord: Boolean(
      process.env.DISCORD_APPLICATION_ID &&
      process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_PUBLIC_KEY
    ),
    whatsapp: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    )
  };
}

export function validateEnv() {
  const status = getIntegrationStatus();
  const warnings: string[] = [];

  if (!status.groq) warnings.push("GROQ_API_KEY is missing (fallback models will be used).");
  if (!status.hindsight) warnings.push("HINDSIGHT_API_KEY is missing (fallback local memory will be used).");
  if (!status.github) warnings.push("GitHub App credentials (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET) are partially or fully missing.");
  if (!status.slack) warnings.push("Slack Bot credentials (SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET) are missing.");
  if (!status.discord) warnings.push("Discord Bot credentials (DISCORD_APPLICATION_ID, DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY) are missing.");
  if (!status.whatsapp) warnings.push("Twilio WhatsApp credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER) are missing.");

  if (warnings.length > 0) {
    console.warn("⚠️ Mnemo Environment Status Warnings:");
    warnings.forEach((w) => console.warn(`  - ${w}`));
  } else {
    console.log("✅ All Mnemo production integration environment keys are configured.");
  }
}
