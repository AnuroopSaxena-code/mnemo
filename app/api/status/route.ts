import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/env";
import { readLocalDecisions } from "@/lib/local-memory";

export async function GET() {
  try {
    const status = getIntegrationStatus();
    
    let decisionCount = 0;
    try {
      const decisions = await readLocalDecisions();
      decisionCount = decisions.length;
    } catch (err) {
      console.warn("Failed reading local decision count for status API:", err);
    }

    return NextResponse.json({
      ...status,
      decisionCount
    });
  } catch (error) {
    console.error("Status endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration status." },
      { status: 500 }
    );
  }
}
