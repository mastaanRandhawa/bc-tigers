import apiClient from '@/lib/api-client';
import type { Division } from '@/types';

export const divisionsService = {
  getAll: () => apiClient.get<Division[]>('/divisions'),

  getByTournament: (tournamentSlug: string) =>
    apiClient.get<Division[]>(`/tournaments/${tournamentSlug}/divisions`),

  getOne: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<Division>(`/tournaments/${tournamentSlug}/divisions/${divisionSlug}`),

  getBySlugGlobal: (divisionSlug: string) =>
    apiClient.get<Division | Division[]>('/divisions/by-slug/' + divisionSlug),

  create: (data: Partial<Division>) => apiClient.post<Division>('/divisions', data),

  update: (id: string, data: Partial<Division>) =>
    apiClient.patch<Division>(`/divisions/${id}`, data),

  delete: (id: string) => apiClient.delete<Division>(`/divisions/${id}`),
};
