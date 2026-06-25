import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import { DEFAULT_MAX_PLAYERS_PER_TEAM } from '../../common/roster-limits';
import { getCoachLockStatus } from '../auth/coach-lock';

const SETTINGS_FIELDS = [
  'site_name',
  'contact_email',
  'contact_phone',
  'contact_address',
  'timezone',
  'coach_management_locked',
  'coach_lock_scheduled_at',
  'max_players_per_team',
] as const;

const DEFAULT_SETTINGS = {
  id: 'default',
  site_name: 'BC Tigers Soccer',
  contact_email: 'info@bctigers.ca',
  contact_phone: null as string | null,
  contact_address: null as string | null,
  timezone: 'America/Vancouver',
  max_players_per_team: DEFAULT_MAX_PLAYERS_PER_TEAM,
};

@Injectable()
export class SettingsService {
  async getPublic() {
    const settings = await this.getOrCreate();
    const lockStatus = await getCoachLockStatus();
    return {
      site_name: settings.site_name,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
      rosters_public: lockStatus.coach_management_locked,
      rosters_available_at:
        lockStatus.coach_lock_scheduled_pending &&
        settings.coach_lock_scheduled_at
          ? settings.coach_lock_scheduled_at.toISOString()
          : null,
    };
  }

  async getAdmin() {
    const settings = await this.getOrCreate();
    const lockStatus = await getCoachLockStatus();
    return {
      ...settings,
      coach_lock_scheduled_at:
        settings.coach_lock_scheduled_at?.toISOString() ?? null,
      coach_lock_manual: settings.coach_management_locked,
      coach_lock_scheduled_pending: lockStatus.coach_lock_scheduled_pending,
      coach_lock_scheduled_active: lockStatus.coach_lock_scheduled_active,
      coach_lock_effective: lockStatus.coach_management_locked,
    };
  }

  async update(data: unknown) {
    await this.getOrCreate();
    const source = data as Record<string, unknown>;
    const payload = pickAllowed<Prisma.SiteSettingsUpdateInput>(
      data,
      SETTINGS_FIELDS,
    );

    if (
      Object.prototype.hasOwnProperty.call(source, 'coach_lock_scheduled_at')
    ) {
      const raw = source.coach_lock_scheduled_at;
      payload.coach_lock_scheduled_at =
        raw === null || raw === ''
          ? null
          : raw instanceof Date
            ? raw
            : typeof raw === 'string' || typeof raw === 'number'
              ? new Date(raw)
              : null;
    }

    if (Object.prototype.hasOwnProperty.call(source, 'max_players_per_team')) {
      const raw = Number(source.max_players_per_team);
      payload.max_players_per_team =
        Number.isFinite(raw) && raw > 0
          ? Math.floor(raw)
          : DEFAULT_MAX_PLAYERS_PER_TEAM;
    }

    return prisma.siteSettings.update({
      where: { id: 'default' },
      data: payload,
    });
  }

  private async getOrCreate() {
    return prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: DEFAULT_SETTINGS,
      update: {},
    });
  }
}

export async function getMaxPlayersPerTeam(): Promise<number> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
    select: { max_players_per_team: true },
  });
  return settings?.max_players_per_team ?? DEFAULT_MAX_PLAYERS_PER_TEAM;
}
