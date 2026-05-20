import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

const DEFAULT_SETTINGS = {
  id: 'default',
  site_name: 'BC Tigers Soccer',
  contact_email: 'info@bctigers.ca',
  contact_phone: '+1 (604) 555-0100',
  contact_address: '3883 Imperial St, Burnaby, BC V5S 3V5',
  timezone: 'America/Vancouver',
  registration_open: true,
  notifications_enabled: true,
  live_score_updates: true,
  max_teams_per_division: 10,
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
};

@Injectable()
export class SettingsService {
  async getPublic() {
    const settings = await this.getOrCreate();
    return {
      site_name: settings.site_name,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
    };
  }

  async getAdmin() {
    return this.getOrCreate();
  }

  async update(data: unknown) {
    await this.getOrCreate();
    return prisma.siteSettings.update({
      where: { id: 'default' },
      data: data as Prisma.SiteSettingsUpdateInput,
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
