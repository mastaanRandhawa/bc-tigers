import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { softDeleteExtension } from './soft-delete.extension';

function createBaseClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Remote hosts (e.g. Render, Supabase, Neon) require SSL; localhost does not.
  const isRemote =
    !connectionString.includes('localhost') &&
    !connectionString.includes('127.0.0.1');

  const adapter = new PrismaPg({
    connectionString,
    ...(isRemote && { ssl: { rejectUnauthorized: false } }),
  });

  return new PrismaClient({ adapter });
}

/** Base client wrapped with the soft-delete read-scoping extension. */
function createPrismaClient() {
  return createBaseClient().$extends(softDeleteExtension);
}

type ExtendedClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedClient | undefined;
};

export const prisma: ExtendedClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
