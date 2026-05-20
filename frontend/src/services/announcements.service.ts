import apiClient from '@/lib/api-client';
import type { Announcement } from '@/types';

export const announcementsService = {
  getAll: () => apiClient.get<Announcement[]>('/announcements'),
  getOne: (slug: string) => apiClient.get<Announcement>(`/announcements/${slug}`),
  create: (data: Partial<Announcement>) => apiClient.post<Announcement>('/announcements', data),
  update: (id: string, data: Partial<Announcement>) =>
    apiClient.patch<Announcement>(`/announcements/${id}`, data),
  delete: (id: string) => apiClient.delete(`/announcements/${id}`),
};
