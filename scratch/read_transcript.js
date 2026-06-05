const fs = require('fs');
const path = require('path');

const logFilePath = 'C:\\Users\\anuro\\.gemini\\antigravity-ide\\brain\\71bbb474-939b-458c-b231-c1b64f55414e\\.system_generated\\logs\\transcript.jsonl';
const outputFilePath = 'c:\\Users\\anuro\\Documents\\Mnemo\\scratch\\master_prompt.md';

try {
  const content = fs.readFileSync(logFilePath, 'utf8');
  const lines = content.split('\n');
  
  // Find line with step_index: 687
  let targetLine = null;
  for (const line of lines) {
    if (line.includes('"step_index":687') || line.includes('"step_index": 687')) {
      targetLine = line;
      break;
    }
  }
  
  if (!targetLine) {
    // Fallback: search for Master Implementation Prompt
    for (const line of lines) {
      if (line.includes('Master Implementation Prompt')) {
        targetLine = line;
        break;
      }
    }
  }

  if (targetLine) {
    const parsed = JSON.parse(targetLine);
    const textContent = parsed.content;
    fs.writeFileSync(outputFilePath, textContent, 'utf8');
    console.log(`Successfully wrote full content to ${outputFilePath}`);
  } else {
    console.error('Could not find the target step in transcript.');
  }
} catch (err) {
  console.error('Error reading/writing files:', err);
}
