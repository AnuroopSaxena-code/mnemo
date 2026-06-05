import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { encrypt, generateId } from "@/lib/crypto";

export async function GET(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/?error=unauthorized`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`);
  }

  try {
    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        code
      })
    });

    const data = await res.json();
    if (data.ok) {
      const teamId = data.team?.id;
      const botToken = data.access_token;

      if (teamId && botToken) {
        await db.botInstallation.upsert({
          where: {
            platform_platformId: {
              platform: "slack",
              platformId: teamId
            }
          },
          update: {
            workspaceId: session.workspaceId,
            platformToken: encrypt(botToken)
          },
          create: {
            id: generateId("inst"),
            workspaceId: session.workspaceId,
            platform: "slack",
            platformId: teamId,
            platformToken: encrypt(botToken)
          }
        });
      }
    }
  } catch (err) {
    console.error("Slack bot callback error:", err);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`);
}
