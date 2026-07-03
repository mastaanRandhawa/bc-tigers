import prisma from '../../prisma/prisma';

/**
 * Roster public-display lock. Independent of the coach-edit lock
 * (see coach-lock.ts): this one controls whether rosters are visible on the
 * public site, not whether coaches can edit them.
 */
type PublicLockSettings = {
  rosters_public: boolean;
  rosters_public_scheduled_at: Date | null;
};

const PUBLIC_LOCK_SELECT = {
  rosters_public: true,
  rosters_public_scheduled_at: true,
} as const;

export function isRosterPublicEffective(
  settings: PublicLockSettings | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!settings) return false;
  if (settings.rosters_public) return true;
  if (
    settings.rosters_public_scheduled_at &&
    settings.rosters_public_scheduled_at <= now
  ) {
    return true;
  }
  return false;
}

/** Promote a due scheduled reveal to the manual flag (one-time activation). */
export async function resolveRosterPublicSettings(
  now: Date = new Date(),
): Promise<PublicLockSettings | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
    select: PUBLIC_LOCK_SELECT,
  });
  if (!settings) return null;

  if (
    !settings.rosters_public &&
    settings.rosters_public_scheduled_at &&
    settings.rosters_public_scheduled_at <= now
  ) {
    return prisma.siteSettings.update({
      where: { id: 'default' },
      data: {
        rosters_public: true,
        rosters_public_scheduled_at: null,
      },
      select: PUBLIC_LOCK_SELECT,
    });
  }

  return settings;
}

export async function getRosterPublicStatus(now: Date = new Date()) {
  const settings = await resolveRosterPublicSettings(now);
  const scheduledAt = settings?.rosters_public_scheduled_at ?? null;
  const manual = settings?.rosters_public ?? false;
  const effective = isRosterPublicEffective(settings, now);

  return {
    rosters_public: effective,
    rosters_public_manual: manual,
    rosters_public_scheduled_at: scheduledAt?.toISOString() ?? null,
    rosters_public_scheduled_pending: scheduledAt ? scheduledAt > now : false,
    rosters_public_scheduled_active: scheduledAt ? scheduledAt <= now : false,
  };
}
