import apiClient from '@/lib/api-client';
import type { Player } from '@/types';

export const playersService = {
  getAll: (params?: { teamId?: string; page?: number; limit?: number }) =>
    apiClient.get<Player[]>('/players', { params }),

  getOne: (slug: string) => apiClient.get<Player>(`/players/${slug}`),

  create: (data: Partial<Player>) => apiClient.post<Player>('/players', data),

  update: (id: string, data: Partial<Player>) =>
    apiClient.patch<Player>(`/players/${id}`, data),

  delete: (id: string) => apiClient.delete<Player>(`/players/${id}`),
};
