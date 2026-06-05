import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { decrypt, generateId } from "@/lib/crypto";

export async function POST(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { repoIds } = body;
    
    if (!Array.isArray(repoIds)) {
      return NextResponse.json({ error: "Invalid payload format. repoIds must be an array." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.githubToken) {
      return NextResponse.json({ error: "GitHub credentials missing" }, { status: 400 });
    }

    const githubToken = decrypt(user.githubToken);

    // Fetch repository details from GitHub App or user oauth for metadata accuracy
    const reposData = await Promise.all(
      repoIds.map(async (id) => {
        try {
          const res = await fetch(`https://api.github.com/repositories/${id}`, {
            headers: { 
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "mnemo-app"
            }
          });
          if (res.ok) {
            return res.json();
          }
        } catch (err) {
          console.error(`Failed to fetch repo ${id}:`, err);
        }
        return null;
      })
    );

    const validRepos = reposData.filter(Boolean);
    const githubRepoIds = validRepos.map((repo: any) => String(repo.id));

    // Find already connected repos in this workspace
    const existingRepos = await db.repo.findMany({
      where: {
        workspaceId: session.workspaceId,
        githubRepoId: { in: githubRepoIds }
      },
      select: { githubRepoId: true }
    });
    const existingSet = new Set(existingRepos.map(r => r.githubRepoId));

    const inserts = validRepos
      .filter((repo: any) => !existingSet.has(String(repo.id)))
      .map((repo: any) => ({
        id: generateId("repo"),
        workspaceId: session.workspaceId,
        githubRepoId: String(repo.id),
        fullName: repo.full_name
      }));

    if (inserts.length > 0) {
      await db.repo.createMany({
        data: inserts
      });
    }

    return NextResponse.json({ connected: inserts.length, repos: inserts });
  } catch (err: any) {
    console.error("Connect repos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
