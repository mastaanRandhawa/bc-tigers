import type { UserRole } from '@prisma/client';
import prisma from '../prisma/prisma';
import { slugifyPlayerName, ensureUniquePlayerSlug } from './player-slug';

/** Create or link Coach / Player / Referee profile when user role is assigned. */
export async function ensureRoleProfile(
  userId: string,
  role: UserRole,
  names: { first_name: string; last_name: string; email: string; phone?: string | null },
) {
  if (role === 'COACH') {
    const existing = await prisma.coach.findUnique({ where: { user_id: userId } });
    if (existing) return existing;
    return prisma.coach.create({
      data: {
        first_name: names.first_name,
        last_name: names.last_name,
        email: names.email,
        phone: names.phone ?? undefined,
        user_id: userId,
      },
    });
  }

  if (role === 'PLAYER') {
    const existing = await prisma.player.findUnique({ where: { user_id: userId } });
    if (existing) return existing;
    const base = slugifyPlayerName(names.first_name, names.last_name);
    const slug = await ensureUniquePlayerSlug(prisma, base);
    return prisma.player.create({
      data: {
        first_name: names.first_name,
        last_name: names.last_name,
        slug,
        user_id: userId,
      },
    });
  }

  if (role === 'REFEREE') {
    const existing = await prisma.referee.findUnique({ where: { user_id: userId } });
    if (existing) return existing;
    return prisma.referee.create({
      data: {
        first_name: names.first_name,
        last_name: names.last_name,
        email: names.email,
        phone: names.phone ?? undefined,
        user_id: userId,
      },
    });
  }

  return null;
}
