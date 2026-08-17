import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client.js";

export type Db = PrismaClient;

export function createDb(connectionString: string): { prisma: PrismaClient; pool: Pool } {
  const max = Number(process.env.PG_POOL_MAX);
  const pool = new Pool({
    connectionString,
    ...(Number.isFinite(max) && max > 0 ? { max } : {}),
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

export type { Pool } from "pg";
export * from "./generated/prisma/client.js";
export { Prisma, PrismaClient } from "./generated/prisma/client.js";
