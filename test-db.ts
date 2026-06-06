import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users:', users.map(u => ({ id: u.id, discordId: u.discordId, discordUsername: u.discordUsername, workspaceId: u.workspaceId })))

  const repos = await prisma.repo.findMany()
  console.log('Repos:', repos.map(r => ({ id: r.id, fullName: r.fullName, workspaceId: r.workspaceId })))
}

main().catch(console.error).finally(() => prisma.$disconnect())
