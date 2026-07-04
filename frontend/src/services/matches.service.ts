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

  updateScore: (
    id: string,
    home_score: number,
    away_score: number,
    options?: {
      home_penalties?: number | null;
      away_penalties?: number | null;
      tie_resolution?: 'DRAW' | 'PENALTIES' | null;
    },
  ) =>
    apiClient.patch<Match>(`/matches/${id}/score`, {
      home_score,
      away_score,
      ...options,
    }),

  addEvent: (
    matchId: string,
    data: {
      player_id?: string;
      team_id: string;
      type: MatchEventType;
      minute: number;
      extra_time?: number;
    },
  ) => apiClient.post<MatchEvent>(`/matches/${matchId}/events`, data),

  updateEvent: (
    matchId: string,
    eventId: string,
    data: {
      player_id?: string | null;
      team_id?: string;
      type?: MatchEventType;
      minute?: number;
      extra_time?: number | null;
    },
  ) => apiClient.patch<MatchEvent>(`/matches/${matchId}/events/${eventId}`, data),

  deleteEvent: (matchId: string, eventId: string) =>
    apiClient.delete<{ id: string }>(`/matches/${matchId}/events/${eventId}`),

  delete: (id: string) => apiClient.delete<Match>(`/matches/${id}`),
};
