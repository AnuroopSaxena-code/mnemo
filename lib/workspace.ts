import { db } from "./db";
import { generateId } from "./crypto";

export async function resolveWorkspace(platform: "github" | "slack" | "discord", platformId: string) {
  let installation = await db.botInstallation.findFirst({
    where: { platform, platformId },
    include: { workspace: true }
  });
  
  if (!installation) {
    // Retrieve the active workspace (or create the default demo workspace)
    let workspace = await db.workspace.findFirst();
    if (!workspace) {
      workspace = await db.workspace.create({
        data: {
          id: "ws_demo",
          name: "Demo Workspace",
          hindsightBankId: process.env.HINDSIGHT_BANK_ID || "mnemo"
        }
      });
    }

    try {
      installation = await db.botInstallation.create({
        data: {
          id: generateId("inst"),
          workspaceId: workspace.id,
          platform,
          platformId
        },
        include: { workspace: true }
      });
    } catch (err) {
      // Handle concurrency or duplicate installation creation gracefully
      console.warn("Installation link creation collision:", err);
      const refetched = await db.botInstallation.findFirst({
        where: { platform, platformId },
        include: { workspace: true }
      });
      if (refetched) {
        installation = refetched;
      } else {
        throw err;
      }
    }
  }

  return {
    workspaceId: installation.workspaceId,
    bankId: installation.workspace.hindsightBankId
  };
}
