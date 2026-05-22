import apiClient from '@/lib/api-client';
import type { Coach } from '@/types';

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
