import apiClient from '@/lib/api-client';
import type { Division, Match, Media, Standing, PlayerStat } from '@/types';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  tournament_id?: string | null;
}

export const tournamentResourcesService = {
  getDivisions: (tournamentSlug: string) =>
    apiClient.get<Division[]>(`/tournaments/${tournamentSlug}/divisions`),

  getMatches: (tournamentSlug: string, params?: { status?: string; limit?: number }) =>
    apiClient.get<Match[]>(`/tournaments/${tournamentSlug}/matches`, { params }),

  getStandings: (tournamentSlug: string) =>
    apiClient.get<Standing[]>(`/tournaments/${tournamentSlug}/standings`),

  getVenues: (tournamentSlug: string) =>
    apiClient.get(`/tournaments/${tournamentSlug}/venues`),

  getMedia: (tournamentSlug: string, limit?: number) =>
    apiClient.get<Media[]>(`/tournaments/${tournamentSlug}/media`, {
      params: limit ? { limit } : undefined,
    }),

  getAnnouncements: (tournamentSlug: string, limit?: number) =>
    apiClient.get<Announcement[]>(`/tournaments/${tournamentSlug}/announcements`, {
      params: limit ? { limit } : undefined,
    }),

  getTopScorers: (tournamentSlug: string, limit?: number) =>
    apiClient.get<PlayerStat[]>(`/tournaments/${tournamentSlug}/stats/top-scorers`, {
      params: limit ? { limit } : undefined,
    }),
};
