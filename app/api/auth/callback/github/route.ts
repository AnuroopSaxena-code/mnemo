import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt, generateId } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET || "default_session_secret_for_cookies";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // 1. Exchange code for access token
  const clientId = process.env.GITHUB_CLIENT_ID || "";
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";
  
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { 
        "Accept": "application/json", 
        "Content-Type": "application/json",
        "User-Agent": "mnemo-app"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
    
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.json({ error: `GitHub token exchange failed: ${errText}` }, { status: 400 });
    }
    
    const tokenData = await tokenRes.json();
    const access_token = tokenData.access_token;
    
    if (!access_token) {
      return NextResponse.json({ error: "Access token missing from GitHub response" }, { status: 400 });
    }

    // 2. Fetch GitHub user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { 
        Authorization: `Bearer ${access_token}`,
        "User-Agent": "mnemo-app"
      }
    });
    
    if (!userRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile from GitHub" }, { status: 400 });
    }
    
    const githubUser = await userRes.json();
    const githubId = String(githubUser.id);
    const githubLogin = githubUser.login || "unknown";

    // 3. Check if user already exists
    let user = await db.user.findUnique({ where: { githubId } });

    if (!user) {
      let workspaceId = generateId("ws");
      let bankId = generateId("bank");
      let role = "owner";

      // If state matches a workspace invite token, parse and join that workspace
      if (state && state.trim() !== "") {
        try {
          const decoded = jwt.verify(state, SECRET) as { workspaceId: string };
          if (decoded && decoded.workspaceId) {
            workspaceId = decoded.workspaceId;
            role = "member";
          }
        } catch (err) {
          console.error("Invalid workspace invite token in state:", err);
        }
      }

      user = await db.$transaction(async (tx: any) => {
        // Create Workspace if the user is owner (new workspace)
        if (role === "owner") {
          await tx.workspace.create({
            data: {
              id: workspaceId,
              name: `${githubLogin}'s Workspace`,
              hindsightBankId: bankId
            }
          });
        }

        // Create the user record
        return tx.user.create({
          data: {
            id: generateId("usr"),
            workspaceId,
            githubId,
            githubLogin,
            githubToken: encrypt(access_token),
            role
          }
        });
      });
    } else {
      // Update access token if user exists
      user = await db.user.update({
        where: { id: user.id },
        data: { githubToken: encrypt(access_token) }
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to persist user profile" }, { status: 500 });
    }

    // 4. Set session cookie and redirect to home
    const session = createSession(user.id, user.workspaceId);
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`;
    const response = NextResponse.redirect(redirectUrl);
    
    // Cookie valid for 7 days
    response.headers.set(
      "Set-Cookie", 
      `session=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );
    
    return response;
  } catch (err: any) {
    console.error("GitHub OAuth Callback Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
