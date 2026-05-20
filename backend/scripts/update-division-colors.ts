import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
const adapter = new PrismaPg({
  connectionString,
  ...(isRemote && { ssl: { rejectUnauthorized: false } }),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.division.updateMany({
    where: { slug: 'boys-u18-open' },
    data: { primary_color: '#F48735', accent_color: '#FEF3EB' },
  });
  await prisma.division.updateMany({
    where: { slug: 'girls-u16-select' },
    data: { primary_color: '#7C3AED', accent_color: '#F3E8FF' },
  });
  const divs = await prisma.division.findMany({
    select: { name: true, primary_color: true, accent_color: true },
  });
  console.log('Division colors updated:', divs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
