import prisma from '../../prisma/prisma';

type LockSettings = {
  coach_management_locked: boolean;
  coach_lock_scheduled_at: Date | null;
};

const LOCK_SELECT = {
  coach_management_locked: true,
  coach_lock_scheduled_at: true,
} as const;

export function isCoachLockEffective(
  settings: LockSettings | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!settings) return false;
  if (settings.coach_management_locked) return true;
  if (
    settings.coach_lock_scheduled_at &&
    settings.coach_lock_scheduled_at <= now
  ) {
    return true;
  }
  return false;
}

/** Promote a due scheduled lock to the manual lock flag (one-time activation). */
export async function resolveCoachLockSettings(
  now: Date = new Date(),
): Promise<LockSettings | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
    select: LOCK_SELECT,
  });
  if (!settings) return null;

  if (
    !settings.coach_management_locked &&
    settings.coach_lock_scheduled_at &&
    settings.coach_lock_scheduled_at <= now
  ) {
    return prisma.siteSettings.update({
      where: { id: 'default' },
      data: {
        coach_management_locked: true,
        coach_lock_scheduled_at: null,
      },
      select: LOCK_SELECT,
    });
  }

  return settings;
}

export async function getCoachLockSettings() {
  return resolveCoachLockSettings();
}

export async function getCoachLockStatus(now: Date = new Date()) {
  const settings = await resolveCoachLockSettings(now);
  const scheduledAt = settings?.coach_lock_scheduled_at ?? null;
  const manual = settings?.coach_management_locked ?? false;
  const effective = isCoachLockEffective(settings, now);

  return {
    coach_management_locked: effective,
    coach_lock_manual: manual,
    coach_lock_scheduled_at: scheduledAt?.toISOString() ?? null,
    coach_lock_scheduled_pending: scheduledAt ? scheduledAt > now : false,
    coach_lock_scheduled_active: scheduledAt ? scheduledAt <= now : false,
  };
}
