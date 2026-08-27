import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./prisma/dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const adapter = new PrismaLibSql({
  url,
  authToken,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
