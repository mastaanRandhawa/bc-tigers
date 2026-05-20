import apiClient from '@/lib/api-client';
import type { Coach, Notification, TeamRoster } from '@/types';

export const coachesService = {
  getAll: () => apiClient.get<Coach[]>('/coaches'),
  getOne: (id: string) => apiClient.get<Coach>(`/coaches/${id}`),
  create: (data: Partial<Coach>) => apiClient.post<Coach>('/coaches', data),
  update: (id: string, data: Partial<Coach>) => apiClient.patch<Coach>(`/coaches/${id}`, data),
  delete: (id: string) => apiClient.delete(`/coaches/${id}`),
  assignToTeam: (teamId: string, data: { coach_id: string; role?: string }) =>
    apiClient.post(`/teams/${teamId}/coaches`, data),
  removeFromTeam: (teamId: string, teamCoachId: string) =>
    apiClient.delete(`/teams/${teamId}/coaches/${teamCoachId}`),
};

export const rostersService = {
  getByTeam: (teamId: string) => apiClient.get<TeamRoster[]>(`/teams/${teamId}/rosters`),
  add: (teamId: string, data: { player_id: string; season?: string; active?: boolean }) =>
    apiClient.post<TeamRoster>(`/teams/${teamId}/rosters`, data),
  update: (teamId: string, rosterId: string, data: { active?: boolean; season?: string }) =>
    apiClient.patch<TeamRoster>(`/teams/${teamId}/rosters/${rosterId}`, data),
  remove: (teamId: string, rosterId: string) =>
    apiClient.delete(`/teams/${teamId}/rosters/${rosterId}`),
};

export const notificationsService = {
  getMine: () => apiClient.get<Notification[]>('/notifications'),
  markRead: (id: string) => apiClient.patch<Notification>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<{ message: string }>('/notifications/read-all'),
  create: (data: Partial<Notification>) => apiClient.post<Notification>('/notifications', data),
};
