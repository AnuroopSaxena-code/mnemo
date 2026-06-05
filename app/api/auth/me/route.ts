import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { 
        workspace: {
          include: {
            repos: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        githubLogin: user.githubLogin,
        role: user.role
      },
      workspace: {
        id: user.workspaceId,
        name: user.workspace.name,
        bankId: user.workspace.hindsightBankId,
        repos: user.workspace.repos.map((r) => r.fullName)
      }
    });
  } catch (err: any) {
    console.error("Auth Me Query failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
