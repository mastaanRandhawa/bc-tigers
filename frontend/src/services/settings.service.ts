import apiClient from '@/lib/api-client';
import type { PublicSiteSettings, SiteSettings } from '@/types';

export const settingsService = {
  getPublic: () => apiClient.get<PublicSiteSettings>('/settings/public'),
  getAdmin: () => apiClient.get<SiteSettings>('/settings'),
  update: (data: Partial<SiteSettings>) => apiClient.patch<SiteSettings>('/settings', data),
};
