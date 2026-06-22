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

  // Prefer verified TLS: if a CA cert is supplied (DATABASE_CA_CERT, PEM
  // contents), validate the server certificate against it. Otherwise fall back
  // to the permissive mode managed hosts often need — but allow tightening via
  // DATABASE_SSL_REJECT_UNAUTHORIZED=true without redeploying code.
  const caCert = process.env.DATABASE_CA_CERT;
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' || Boolean(caCert);
  const ssl = isRemote
    ? { rejectUnauthorized, ...(caCert ? { ca: caCert } : {}) }
    : undefined;

  const adapter = new PrismaPg({
    connectionString,
    ...(ssl && { ssl }),
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
