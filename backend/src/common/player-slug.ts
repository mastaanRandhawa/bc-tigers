import { randomUUID } from 'crypto';

/**
 * Minimal client shape needed for slug uniqueness checks. Structural so it
 * accepts both the base PrismaClient and the extended (soft-delete) client.
 */
type PlayerSlugClient = {
  player: {
    findUnique(args: {
      where: { team_id_slug: { team_id: string; slug: string } };
    }): Promise<{ id: string } | null>;
  };
};

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
  prisma: PlayerSlugClient,
  teamId: string,
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.player.findUnique({
      where: { team_id_slug: { team_id: teamId, slug } },
    });
    if (!existing || existing.id === excludeId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

export function playerLookupWhere(param: string, teamId?: string) {
  if (isUuid(param)) return { id: param };
  if (teamId) return { slug: param };
  return { slug: param };
}
