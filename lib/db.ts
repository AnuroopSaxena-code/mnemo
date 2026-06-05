import { PrismaClient } from '@prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'
import { env } from './env'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getPrismaClient(): PrismaClient {
  // Use Prisma Postgres adapter as required by Prisma 7
  const adapter = new PrismaPostgresAdapter({ connectionString: env.databaseUrl })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const db = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
