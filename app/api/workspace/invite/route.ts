import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET || "default_session_secret_for_cookies";

export async function POST(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inviteToken = jwt.sign(
      { workspaceId: session.workspaceId },
      SECRET,
      { expiresIn: "2d" }
    );

    return NextResponse.json({ inviteToken });
  } catch (err: any) {
    console.error("Workspace invite token generation failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
