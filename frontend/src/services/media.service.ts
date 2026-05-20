import apiClient from '@/lib/api-client';
import type { Media } from '@/types';

export const mediaService = {
  getAll: (params?: { tournamentId?: string; divisionId?: string }) =>
    apiClient.get<Media[]>('/media', { params }),

  upload: (data: {
    url: string;
    type?: Media['type'];
    title?: string;
    description?: string;
    tournament_id?: string;
    division_id?: string;
    match_id?: string;
  }) => apiClient.post<Media>('/media/upload', data),

  delete: (id: string) => apiClient.delete<Media>(`/media/${id}`),
};
