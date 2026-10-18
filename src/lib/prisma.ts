import { PrismaClient } from "@prisma/client";

// Every id is BIGINT (migration 026), which Prisma returns as a JS bigint, and
// JSON.stringify throws on a bigint. Ids stay far below 2^53, so a number is
// exact; this keeps any id that reaches a JSON response from crashing it.
declare global {
  interface BigInt {
    toJSON(): number;
  }
}
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
