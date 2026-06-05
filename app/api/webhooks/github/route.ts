import { NextResponse } from "next/server";
import { extractGitHubComment, verifyGitHubSignature } from "@/lib/github";
import { generatePremortem } from "@/lib/premortem";
import { retainDecision } from "@/lib/retain";
import { postPRComment } from "@/lib/github-app";

const DECISION_SIGNALS = [
  "decided",
  "going with",
  "rejected",
  "instead of",
  "tradeoff",
  "because",
  "moving away",
  "revisit",
  "rollback",
  "switch to",
  "chose"
];

// In-memory rate limiter cache to avoid double webhook processing within 5 mins
const prCache = new Map<string, number>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature(process.env.GITHUB_WEBHOOK_SECRET, body, signature)) {
    return NextResponse.json({ error: "Invalid GitHub signature." }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventType = request.headers.get("x-github-event");

  const owner = payload.repository?.owner?.login;
  const repo = payload.repository?.name;
  const installationId = payload.installation?.id;

  // 1. Handle PR open/synchronize
  if (eventType === "pull_request" && (payload.action === "opened" || payload.action === "synchronize")) {
    const prNumber = payload.pull_request?.number;
    const title = payload.pull_request?.title || "";
    const prBody = payload.pull_request?.body || "";
    const prText = `Title: ${title}\nDescription: ${prBody}`;
    
    const cacheKey = `${owner}/${repo}/${prNumber}/${payload.action}`;
    const now = Date.now();
    const lastRun = prCache.get(cacheKey);

    // Clean cache map of expired items
    for (const [key, timestamp] of prCache.entries()) {
      if (now - timestamp > CACHE_TTL_MS) prCache.delete(key);
    }

    if (lastRun && now - lastRun < CACHE_TTL_MS) {
      return NextResponse.json({ skipped: true, reason: "Rate limited (recently processed)." });
    }
    prCache.set(cacheKey, now);

    try {
      const source = `${owner}/${repo} PR #${prNumber}: ${title}`;
      const premortem = await generatePremortem(prText, "github");
      
      let commentPosted = false;
      let decisionRetained = false;

      // Post comment back to PR on high/critical warning levels
      if ((premortem.warningLevel === "high" || premortem.warningLevel === "critical") && installationId) {
        let commentText = `### 🧠 Mnemo Pre-Mortem Risk Alert\n\n`;
        commentText += `**Warning Level:** ${premortem.warningLevel.toUpperCase()}\n`;
        commentText += `**Headline:** ${premortem.headline}\n\n`;
        commentText += `${premortem.summary}\n\n`;
        commentText += `#### Potential Failure Modes:\n`;
        premortem.failureModes.forEach((mode, i) => {
          commentText += `${i + 1}. **${mode.risk}**\n   * *Why history suggests this:* ${mode.whyHistorySuggestsIt}\n   * *Mitigation:* ${mode.mitigation}\n`;
        });
        
        await postPRComment(owner, repo, prNumber, commentText, String(installationId));
        commentPosted = true;
      }

      // Auto-retain decision on warning level >= medium
      if (premortem.warningLevel !== "low") {
        await retainDecision(prText, "github", source);
        decisionRetained = true;
      }

      return NextResponse.json({ skipped: false, premortem, commentPosted, decisionRetained });
    } catch (err) {
      console.error("Error analyzing PR in webhook:", err);
      return NextResponse.json({ error: "Failed to analyze PR." }, { status: 500 });
    }
  }

  // 2. Handle PR/Issue comments
  const { comment, source } = extractGitHubComment(payload);
  if (comment) {
    const lower = comment.toLowerCase();
    const isDecisionLike = DECISION_SIGNALS.some((signal) => lower.includes(signal));

    if (isDecisionLike) {
      const premortem = await generatePremortem(comment, "github");
      const retained = await retainDecision(comment, "github", source);
      return NextResponse.json({ skipped: false, premortem, retained });
    }
  }

  return NextResponse.json({ skipped: true, reason: "No decision-like comment found." });
}
