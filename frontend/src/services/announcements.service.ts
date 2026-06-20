import apiClient from '@/lib/api-client';
import type { Announcement } from '@/types';

export const announcementsService = {
  getAll: (params?: { tournamentId?: string; limit?: number }) =>
    apiClient.get<Announcement[]>('/announcements', { params }),

  create: (data: {
    title: string;
    message: string;
    type?: string;
    tournament_id?: string | null;
  }) => apiClient.post<Announcement>('/announcements', data),

  update: (
    id: string,
    data: {
      title?: string;
      message?: string;
      type?: string;
      tournament_id?: string | null;
    },
  ) => apiClient.patch<Announcement>(`/announcements/${id}`, data),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/announcements/${id}`),
};
