import apiClient from '@/lib/api-client';
import type { Tournament } from '@/types';

export const tournamentsService = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<Tournament[]>('/tournaments', { params }),

  getOne: (slug: string) => apiClient.get<Tournament>(`/tournaments/${slug}`),

  create: (data: Partial<Tournament>) => apiClient.post<Tournament>('/tournaments', data),

  update: (id: string, data: Partial<Tournament>) =>
    apiClient.patch<Tournament>(`/tournaments/${id}`, data),

  delete: (id: string) => apiClient.delete<Tournament>(`/tournaments/${id}`),
};
