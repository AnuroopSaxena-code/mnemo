import { NextResponse } from "next/server";
import { fetchPRHistory, fetchADRFiles } from "@/lib/github-app";
import { retainDecision } from "@/lib/retain";

export async function POST(request: Request) {
  try {
    const adminToken = request.headers.get("X-Admin-Token");
    
    // Protect endpoint if ADMIN_TOKEN is set in the environment
    if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo, installationId } = body;

    if (!owner || !repo || !installationId) {
      return NextResponse.json(
        { error: "Missing required parameters (owner, repo, installationId)." },
        { status: 400 }
      );
    }

    let prsSynced = 0;
    let adrsSynced = 0;

    // 1. Fetch and retain closed, merged PR history
    try {
      const prs = await fetchPRHistory(owner, repo, String(installationId));
      await Promise.all(
        prs.map(async (pr) => {
          const fullText = `PR #${pr.number}: ${pr.title}\n\nDescription:\n${pr.body}\n\nComments:\n${pr.comments.join("\n")}`;
          const source = `${owner}/${repo} PR #${pr.number}: ${pr.title}`;
          await retainDecision(fullText, "github", source);
        })
      );
      prsSynced = prs.length;
    } catch (err) {
      console.warn("Failed fetching PR history during sync:", err);
    }

    // 2. Fetch and retain ADR Markdown documents
    try {
      const adrs = await fetchADRFiles(owner, repo, String(installationId));
      await Promise.all(
        adrs.map(async (adr) => {
          const source = `${owner}/${repo} ADR: ${adr.path}`;
          await retainDecision(adr.content, "adr", source);
        })
      );
      adrsSynced = adrs.length;
    } catch (err) {
      console.warn("Failed fetching ADR files during sync:", err);
    }

    return NextResponse.json({
      success: true,
      prsSynced,
      adrsSynced,
      message: `Successfully synchronized ${prsSynced} Pull Requests and ${adrsSynced} Architecture Decision Records.`
    });
  } catch (error) {
    console.error("Historical Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed." },
      { status: 500 }
    );
  }
}
