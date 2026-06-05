import { db } from './db'

export async function resolveWorkspace(platform: string, platformId: string) {
  const installation = await db.botInstallation.findUnique({
    where: {
      platform_platformId: { platform, platformId }
    },
    include: { workspace: true }
  })

  if (!installation) return null
  return {
    workspaceId: installation.workspaceId,
    bankId: installation.workspace.hindsightBankId,
  }
}
