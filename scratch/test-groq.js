const { Groq } = require("groq-sdk");
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

const apiKey = process.env.GROQ_API_KEY;
console.log("Groq API Key (first 10 chars):", apiKey ? apiKey.substring(0, 10) + "..." : "undefined");

if (!apiKey) {
  console.error("Missing GROQ_API_KEY");
  process.exit(1);
}

const groq = new Groq({ apiKey });

async function testGroq() {
  try {
    console.log("Testing Groq chat completion with Llama 3.3 in JSON mode...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant. Respond with raw JSON containing a message key." },
        { role: "user", content: "Hello, say hi!" }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    console.log("✅ Success! Groq response:", chatCompletion.choices[0].message.content);
  } catch (err) {
    console.error("❌ Groq error:");
    console.error(err.message || err);
  }
}

testGroq();
