import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'

// ─── Singleton PrismaClient ───────────────────────────────────────────────────
// Using globalThis prevents multiple PrismaClient instances from being created
// during nodemon hot-reloads, which was exhausting the Neon connection pool
// and causing P2037 "Too many database connections" errors.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient())

// Release the Neon connection pool gracefully when nodemon restarts so stale
// connections do not accumulate against Neon's per-project connection limit.
const gracefulShutdown = async () => {
  await prisma.$disconnect()
  process.exit(0)
}

process.once('SIGINT', gracefulShutdown)
process.once('SIGTERM', gracefulShutdown)