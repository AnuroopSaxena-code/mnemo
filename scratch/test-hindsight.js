const { HindsightClient } = require("@vectorize-io/hindsight-client");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local file not found");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (val) process.env[key] = val;
  });
}

loadEnv();

const apiKey = process.env.HINDSIGHT_API_KEY;
const bankId = process.env.HINDSIGHT_BANK_ID || "mnemo";
const baseUrl = process.env.HINDSIGHT_BASE_URL || "https://api.hindsight.vectorize.io";

console.log("API Key (first 10 chars):", apiKey ? apiKey.substring(0, 10) + "..." : "undefined");
console.log("Bank ID:", bankId);
console.log("Base URL:", baseUrl);

if (!apiKey) {
  console.error("Missing HINDSIGHT_API_KEY in .env.local");
  process.exit(1);
}

const client = new HindsightClient({
  baseUrl,
  apiKey,
});

async function runTest() {
  try {
    console.log("1. Testing listing memories in bank...");
    const list = await client.listMemories(bankId, { limit: 1 });
    console.log("✅ Success! Listed memories:", list);
  } catch (err) {
    console.error("❌ Hindsight error during listMemories:");
    if (err.status || err.statusCode) {
      console.error(`Status code: ${err.status || err.statusCode}`);
    }
    console.error(err.message || err);
  }

  try {
    console.log("\n2. Testing recalling from bank...");
    const recallResult = await client.recall(bankId, "test query", { maxTokens: 100, budget: "low" });
    console.log("✅ Success! Recall result:", recallResult);
  } catch (err) {
    console.error("❌ Hindsight error during recall:");
    if (err.status || err.statusCode) {
      console.error(`Status code: ${err.status || err.statusCode}`);
    }
    console.error(err.message || err);
  }
}

runTest();
