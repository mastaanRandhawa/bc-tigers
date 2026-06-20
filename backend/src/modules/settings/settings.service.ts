import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';

const SETTINGS_FIELDS = [
  'site_name',
  'contact_email',
  'contact_phone',
  'contact_address',
  'timezone',
] as const;

const DEFAULT_SETTINGS = {
  id: 'default',
  site_name: 'BC Tigers Soccer',
  contact_email: 'info@bctigers.ca',
  contact_phone: null as string | null,
  contact_address: null as string | null,
  timezone: 'America/Vancouver',
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
      data: pickAllowed<Prisma.SiteSettingsUpdateInput>(data, SETTINGS_FIELDS),
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
