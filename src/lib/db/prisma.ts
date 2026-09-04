import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Next dev reloads modules on every edit; without this the process
 * accumulates clients until Postgres refuses new connections. Production
 * gets one client per instance.
 *
 * Note: Prisma connects as the database owner and therefore BYPASSES Row
 * Level Security. RLS is not protecting anything here — every authorization
 * check lives in requireRole() and the service layer (CLAUDE.md §2).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
