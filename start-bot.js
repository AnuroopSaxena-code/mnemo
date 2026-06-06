const { spawn } = require('child_process');
const path = require('path');

// Ensure dotenv is loaded to check APP_URL or default to localhost:3000 if not specified
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
require('dotenv').config();

const env = { ...process.env };
// Set default local url if no public app url is configured
if (!env.APP_URL && !env.NEXT_PUBLIC_APP_URL) {
  env.APP_URL = 'http://localhost:3000';
}

console.log(`[mnemo-launcher] Starting Discord Bot pointing to: ${env.APP_URL || env.NEXT_PUBLIC_APP_URL}`);

const botProcess = spawn('npx', ['tsx', 'discord-bot/index.ts'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  cwd: __dirname,
  env
});

botProcess.stdout.on('data', (data) => {
  if (process.stdout.writable) {
    process.stdout.write(data);
  }
});

botProcess.stderr.on('data', (data) => {
  if (process.stderr.writable) {
    process.stderr.write(data);
  }
});

botProcess.stdout.on('error', () => {});
botProcess.stderr.on('error', () => {});

botProcess.on('close', (code) => {
  console.log(`[mnemo-launcher] Bot process exited with code ${code}`);
  process.exit(code || 0);
});

