import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = new URL(process.env.DATABASE_URL);
if (!databaseUrl.searchParams.has("connection_limit")) {
  databaseUrl.searchParams.set("connection_limit", "10");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
  log: ["warn", "error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
