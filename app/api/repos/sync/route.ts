import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { retainDecision } from "@/lib/retain";
import { generateId } from "@/lib/crypto";

export async function POST(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repoFullName } = await request.json();
    if (!repoFullName) {
      return NextResponse.json({ error: "repoFullName required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.githubToken) {
      return NextResponse.json({ error: "Credentials missing" }, { status: 400 });
    }

    const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const githubToken = decrypt(user.githubToken);
    
    // Fetch review comments from GitHub PRs
    const url = `https://api.github.com/repos/${repoFullName}/pulls/comments?per_page=30&sort=created&direction=desc`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "mnemo-app"
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch comments from GitHub" }, { status: 500 });
    }

    const comments = await res.json();
    let synced = 0;

    for (const comment of comments) {
      const body = comment.body || "";
      // Match decision indicators
      if (body.toLowerCase().includes("decided") || body.toLowerCase().includes("because")) {
        const result = await retainDecision(
          body,
          "github",
          `${repoFullName} PR comment by @${comment.user?.login}`,
          workspace.hindsightBankId
        );

        await db.decision.create({
          data: {
            id: generateId("dec"),
            workspaceId: workspace.id,
            hindsightId: result.record.id,
            title: result.record.title,
            decision: result.record.decision,
            rationale: result.record.rationale || "",
            alternatives: JSON.stringify(result.record.alternatives || []),
            caveats: (result.record.caveats || []).join(", "),
            scope: result.record.scope || "",
            people: (result.record.people || []).join(", "),
            source: "github_pr",
            sourceUrl: comment.html_url,
            repoFullName,
            state: result.record.state
          }
        });

        synced++;
      }
    }

    return NextResponse.json({ success: true, synced });
  } catch (err: any) {
    console.error("Repository sync error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
