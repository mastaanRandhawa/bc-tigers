import apiClient from '@/lib/api-client';
import type { Match, Standing, Tournament } from '@/types';

export interface TournamentOverview {
  tournament: Tournament;
  liveMatches: Match[];
  recentMatches: Match[];
  upcomingMatches: Match[];
  standingsPreview: Standing[];
}

export const tournamentsService = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<Tournament[]>('/tournaments', { params }),

  getOne: (slug: string) => apiClient.get<Tournament>(`/tournaments/${slug}`),

  getById: (id: string) => apiClient.get<Tournament>(`/tournaments/by-id/${id}`),

  getOverview: (slug: string) =>
    apiClient.get<TournamentOverview>(`/tournaments/${slug}/overview`),

  create: (data: Partial<Tournament>) => apiClient.post<Tournament>('/tournaments', data),

  update: (id: string, data: Partial<Tournament>) =>
    apiClient.patch<Tournament>(`/tournaments/${id}`, data),

  delete: (id: string) => apiClient.delete<Tournament>(`/tournaments/${id}`),
};
