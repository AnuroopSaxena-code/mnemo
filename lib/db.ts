import { PrismaClient } from "@prisma/client";
import { PrismaPostgresAdapter } from "@prisma/adapter-ppg";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/mnemo";
  const adapter = new PrismaPostgresAdapter({ connectionString });
  return new PrismaClient({ adapter });
}


export const db = globalThis.prisma || getPrismaClient();


if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

