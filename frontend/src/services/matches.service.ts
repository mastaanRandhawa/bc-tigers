import apiClient from '@/lib/api-client';
import type { Match, MatchEvent, MatchEventType } from '@/types';

export const matchesService = {
  getAll: (params?: {
    status?: string;
    tournamentId?: string;
    divisionId?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<Match[]>('/matches', { params }),

  getOne: (id: string) => apiClient.get<Match>(`/matches/${id}`),

  create: (data: Partial<Match>) => apiClient.post<Match>('/matches', data),

  update: (id: string, data: Partial<Match>) =>
    apiClient.patch<Match>(`/matches/${id}`, data),

  updateScore: (id: string, home_score: number, away_score: number) =>
    apiClient.patch<Match>(`/matches/${id}/score`, { home_score, away_score }),

  addEvent: (
    matchId: string,
    data: {
      player_id?: string;
      team_id: string;
      type: MatchEventType;
      minute: number;
      extra_time?: number;
    }
  ) => apiClient.post<MatchEvent>(`/matches/${matchId}/events`, data),

  delete: (id: string) => apiClient.delete<Match>(`/matches/${id}`),
};
