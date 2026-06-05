import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.githubToken) {
      return NextResponse.json({ error: "GitHub credentials missing" }, { status: 400 });
    }

    const githubToken = decrypt(user.githubToken);
    
    // Fetch user's accessible repositories
    const url = "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=pushed";
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "mnemo-app"
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`GitHub fetch repos error: ${res.status} ${errText}`);
      return NextResponse.json({ error: "GitHub API query failed" }, { status: 500 });
    }

    const repos = await res.json();
    if (!Array.isArray(repos)) {
      return NextResponse.json({ repos: [] });
    }

    const formatted = repos.map((r: any) => ({
      id: String(r.id),
      name: r.full_name
    }));

    return NextResponse.json({ repos: formatted });
  } catch (err: any) {
    console.error("Fetch available repos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
