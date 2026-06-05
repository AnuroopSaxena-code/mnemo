const fs = require('fs');
const path = require('path');

// Basic parser for .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    if (val) {
      process.env[key] = val;
    }
  });
}

loadEnv();

const appId = process.env.DISCORD_APPLICATION_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;

if (!appId || !botToken) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const url = `https://discord.com/api/v10/applications/${appId}/commands`;

const commands = [
  {
    name: "why",
    description: "Ask Mnemo why a decision was made",
    options: [
      {
        name: "topic",
        description: "The topic or file you want to query (e.g. why did we move off Kafka?)",
        type: 3, // String type
        required: true
      }
    ]
  },
  {
    name: "remember",
    description: "Retain a new decision in Mnemo's memory bank",
    options: [
      {
        name: "text",
        description: "The description of what was decided and why (e.g. chose Postgres for scaling #decision)",
        type: 3, // String type
        required: true
      }
    ]
  }
];

console.log("Registering Discord commands for App ID:", appId);

fetch(url, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bot ${botToken}`
  },
  body: JSON.stringify(commands)
})
.then(res => {
  if (res.ok) {
    console.log("✅ Successfully registered slash commands (/why and /remember) with Discord globally!");
  } else {
    res.text().then(text => {
      console.error(`Failed to register: ${res.status} ${text}`);
    });
  }
})
.catch(err => {
  console.error("Error connecting to Discord API:", err);
});
