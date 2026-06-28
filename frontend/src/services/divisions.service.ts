import apiClient from '@/lib/api-client';
import type { Division } from '@/types';

export const divisionsService = {
  getAll: () => apiClient.get<Division[]>('/divisions'),

  getByTournament: (tournamentSlug: string) =>
    apiClient.get<Division[]>(`/tournaments/${tournamentSlug}/divisions`),

  getOne: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<Division>(`/tournaments/${tournamentSlug}/divisions/${divisionSlug}`),

  create: (data: Partial<Division>) => apiClient.post<Division>('/divisions', data),

  reorder: (order: string[]) =>
    apiClient.post<{ ordered: number }>('/divisions/reorder', { order }),

  update: (id: string, data: Partial<Division>) =>
    apiClient.patch<Division>(`/divisions/${id}`, data),

  delete: (id: string) => apiClient.delete<Division>(`/divisions/${id}`),

  generateSchedule: (
    id: string,
    body?: {
      startDate?: string;
      matchIntervalMinutes?: number;
      venueId?: string;
      fieldId?: string;
    },
    force?: boolean,
  ) =>
    apiClient.post<{ created: number }>(`/divisions/${id}/generate-schedule`, body ?? {}, {
      params: force ? { force: 'true' } : undefined,
    }),
};
