import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton.
 *
 * Why this pattern matters:
 * - Next.js dev mode hot-reloads modules on every edit. A plain
 *   `new PrismaClient()` at module scope would open a fresh connection pool
 *   on each reload and quickly exhaust Postgres connections. Caching the
 *   instance on `globalThis` survives the module reload.
 * - On serverless platforms each warm function instance reuses the client, so
 *   the same cache avoids a new pool per invocation while the instance lives.
 *   (Production traffic should still front the database with a pooler when
 *   the provider limits connections.)
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  // In development, preserve the client across HMR module reloads.
  globalForPrisma.prisma = db;
}

/** Alias kept for callers that prefer the conventional Prisma name. */
export const prisma = db;
