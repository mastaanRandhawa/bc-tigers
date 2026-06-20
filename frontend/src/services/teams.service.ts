import apiClient from '@/lib/api-client';
import type { Team } from '@/types';

export const teamsService = {
  getAll: (params?: { divisionId?: string }) =>
    apiClient.get<Team[]>('/teams', { params }),

  create: (data: Partial<Team>) => apiClient.post<Team>('/teams', data),

  update: (id: string, data: Partial<Team>) =>
    apiClient.patch<Team>(`/teams/${id}`, data),

  delete: (id: string) => apiClient.delete<Team>(`/teams/${id}`),
};
