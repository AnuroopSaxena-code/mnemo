import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generateId } from "@/lib/crypto";

export async function GET(request: Request) {
  const session = getSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/?error=unauthorized`);
  }

  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guild_id");

  if (!guildId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`);
  }

  try {
    await db.botInstallation.upsert({
      where: {
        platform_platformId: {
          platform: "discord",
          platformId: guildId
        }
      },
      update: {
        workspaceId: session.workspaceId
      },
      create: {
        id: generateId("inst"),
        workspaceId: session.workspaceId,
        platform: "discord",
        platformId: guildId
      }
    });
  } catch (err) {
    console.error("Discord bot installation save failed:", err);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`);
}
