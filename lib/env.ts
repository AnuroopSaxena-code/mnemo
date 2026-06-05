const required = [
  'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
  'GITHUB_APP_ID',
  'GITHUB_WEBHOOK_SECRET', 'HINDSIGHT_API_KEY', 'GROQ_API_KEY',
  'SESSION_SECRET', 'NEXT_PUBLIC_APP_URL'
]

// Allow bypass only during next build or when local environment lacks a DB string
const hasDatabaseUrl = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL);
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build' || !hasDatabaseUrl;

for (const key of required) {
  if (!process.env[key] && !isNextBuild) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

const redirectUriRaw = process.env.GITHUB_REDIRECT_URI || process.env.GITHUB_REDIRECT_URL;
if (!redirectUriRaw && !isNextBuild) {
  throw new Error("Missing required environment variable: GITHUB_REDIRECT_URI or GITHUB_REDIRECT_URL")
}

if (!hasDatabaseUrl && !isNextBuild) {
  throw new Error("Missing required environment variable: DATABASE_URL, POSTGRES_URL, or PRISMA_DATABASE_URL")
}

const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_PRIVATE_KEY || (isNextBuild ? 'bW9jay1rZXk=' : '');
if (!privateKeyRaw) {
  throw new Error("Missing required environment variable: GITHUB_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY")
}

// Check if private key is base64 encoded or a raw PEM block
const getDecodedPrivateKey = (raw: string) => {
  if (raw.includes('-----BEGIN RSA PRIVATE KEY-----') || raw.includes('-----BEGIN PRIVATE KEY-----')) {
    // It's a raw PEM string, support escaped newlines if any
    return raw.replace(/\\n/g, '\n');
  }
  try {
    // Try base64 decoding
    return Buffer.from(raw, 'base64').toString('utf-8');
  } catch {
    return raw;
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mnemo',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_client_secret',
    redirectUri: redirectUriRaw || 'http://localhost:3000/api/auth/callback/github',
    appId: process.env.GITHUB_APP_ID || 'mock_app_id',
    privateKey: getDecodedPrivateKey(privateKeyRaw),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'mock_webhook_secret',
  },
  hindsight: {
    apiKey: process.env.HINDSIGHT_API_KEY || 'mock_hindsight_api_key',
    baseUrl: process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io',
  },
  groq: { apiKey: process.env.GROQ_API_KEY || 'mock_groq_api_key' },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID ?? '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    botToken: process.env.DISCORD_BOT_TOKEN ?? '',
    redirectUri: process.env.DISCORD_REDIRECT_URI ?? '',
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID ?? '',
    clientSecret: process.env.SLACK_CLIENT_SECRET ?? '',
    signingSecret: process.env.SLACK_SIGNING_SECRET ?? '',
    redirectUri: process.env.SLACK_REDIRECT_URI ?? '',
  },
  sessionSecret: process.env.SESSION_SECRET || 'mock_session_secret_32_characters_long_minimum',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}
