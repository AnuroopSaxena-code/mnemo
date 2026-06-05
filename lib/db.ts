import { PrismaClient } from '@prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'
import { env } from './env'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getPrismaClient(): PrismaClient {
  const connectionString = env.databaseUrl
  if (!connectionString || connectionString.includes('localhost')) {
    console.warn('[db] WARNING: Using local/fallback database URL. Prisma Postgres may not be available.')
  }
  try {
    // Use Prisma Postgres adapter as required by Prisma 7
    const adapter = new PrismaPostgresAdapter({ connectionString })
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })
  } catch (err) {
    console.error('[db] Failed to initialize PrismaClient:', err)
    throw err
  }
}

export const db = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

