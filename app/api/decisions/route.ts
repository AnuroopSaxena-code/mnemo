import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generateId } from "@/lib/crypto";
import { HindsightClient } from "@vectorize-io/hindsight-client";

function getHindsightClient() {
  if (!process.env.HINDSIGHT_API_KEY) return null;
  return new HindsightClient({
    baseUrl: process.env.HINDSIGHT_BASE_URL || "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
  });
}

export async function GET(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoName = searchParams.get("repo");

  try {
    const decisions = await db.decision.findMany({
      where: {
        workspaceId: session.workspaceId,
        ...(repoName ? { repoFullName: repoName } : {})
      },
      orderBy: { createdAt: "desc" }
    });

    // Map string fields back to array / JSON formats if needed
    const formatted = decisions.map((d) => ({
      ...d,
      alternatives: d.alternatives ? JSON.parse(d.alternatives) : [],
      caveats: d.caveats ? d.caveats.split(",").map(c => c.trim()).filter(Boolean) : [],
      people: d.people ? d.people.split(",").map(p => p.trim()).filter(Boolean) : [],
    }));

    return NextResponse.json({ decisions: formatted });
  } catch (err: any) {
    console.error("Fetch decisions failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      decision, 
      rationale, 
      alternatives, // Array of { name, rejectedBecause }
      caveats,      // Array of strings
      scope, 
      people,       // Array of strings
      repoFullName, 
      state 
    } = body;

    if (!title || !decision) {
      return NextResponse.json({ error: "Title and Decision are required" }, { status: 400 });
    }

    const workspace = await db.workspace.findUnique({
      where: { id: session.workspaceId }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Retain to Hindsight isolated bank if configured
    const decisionId = generateId("dec");
    let hindsightId = "";
    const hClient = getHindsightClient();
    if (hClient) {
      try {
        const textContent = `Title: ${title}\nDecision: ${decision}\nRationale: ${rationale || ""}\nCaveats: ${(caveats || []).join(", ")}`;
        await hClient.retain(workspace.hindsightBankId, textContent, {
          context: "engineering decision",
          timestamp: new Date(),
          documentId: decisionId,
          metadata: {
            title,
            scope,
            repoFullName,
            author: (people || []).join(", ")
          }
        });
        hindsightId = decisionId;
      } catch (hErr) {
        console.error("Failed to retain to Hindsight Cloud:", hErr);
      }
    }

    const decRecord = await db.decision.create({
      data: {
        id: decisionId,
        workspaceId: session.workspaceId,
        hindsightId,
        title,
        decision,
        rationale: rationale || "",
        alternatives: JSON.stringify(alternatives || []),
        caveats: (caveats || []).join(", "),
        scope: scope || "",
        people: (people || []).join(", "),
        source: "manual",
        repoFullName: repoFullName || "",
        state: state || "decided"
      }
    });

    return NextResponse.json({
      decision: {
        ...decRecord,
        alternatives: alternatives || [],
        caveats: caveats || [],
        people: people || []
      }
    });
  } catch (err: any) {
    console.error("Save decision failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
