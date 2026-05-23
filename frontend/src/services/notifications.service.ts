import apiClient from '@/lib/api-client';
import type { Notification } from '@/types';

export const notificationsService = {
  getMine: () => apiClient.get<Notification[]>('/notifications'),
  markRead: (id: string) => apiClient.patch<Notification>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<{ message: string }>('/notifications/read-all'),
  getAnnouncements: () => apiClient.get<Notification[]>('/notifications/announcements'),
  create: (data: {
    user_id?: string;
    tournament_id?: string;
    title: string;
    message: string;
    type?: string;
  }) => apiClient.post<Notification>('/notifications', data),
  update: (id: string, data: { title?: string; message?: string; tournament_id?: string | null; type?: string }) =>
    apiClient.patch<Notification>(`/notifications/${id}`, data),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/notifications/${id}`),
};
