import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Readable slug from player name; falls back to a short uuid segment */
export function slugifyPlayerName(firstName: string, lastName: string): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || randomUUID().slice(0, 8);
}

export async function ensureUniquePlayerSlug(
  prisma: PrismaClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.player.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

export function playerLookupWhere(param: string) {
  return isUuid(param) ? { id: param } : { slug: param };
}
