import apiClient from '@/lib/api-client';
import type {
  Match,
  RecordScope,
  RecordVersion,
  Standing,
  Tournament,
} from '@/types';

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

  /** Admin list with active/deleted/all scope. */
  getManaged: (scope: RecordScope = 'active') =>
    apiClient.get<Tournament[]>('/tournaments/manage', { params: { scope } }),

  getOne: (slug: string) => apiClient.get<Tournament>(`/tournaments/${slug}`),

  getById: (id: string) => apiClient.get<Tournament>(`/tournaments/by-id/${id}`),

  getOverview: (slug: string) =>
    apiClient.get<TournamentOverview>(`/tournaments/${slug}/overview`),

  create: (data: Partial<Tournament>) => apiClient.post<Tournament>('/tournaments', data),

  update: (id: string, data: Partial<Tournament>) =>
    apiClient.patch<Tournament>(`/tournaments/${id}`, data),

  complete: (id: string) => apiClient.post<Tournament>(`/tournaments/${id}/complete`),

  enableEditing: (id: string) =>
    apiClient.post<Tournament>(`/tournaments/${id}/enable-editing`),

  /** Soft delete (decommission). */
  delete: (id: string) => apiClient.delete<Tournament>(`/tournaments/${id}`),

  restore: (id: string) => apiClient.post<Tournament>(`/tournaments/${id}/restore`),

  /** Permanent hard delete (admin). */
  purge: (id: string) => apiClient.delete<{ id: string }>(`/tournaments/${id}/purge`),

  history: (id: string) =>
    apiClient.get<RecordVersion[]>(`/tournaments/${id}/history`),

  restoreVersion: (id: string, versionId: string) =>
    apiClient.post<Tournament>(`/tournaments/${id}/restore-version/${versionId}`),
};
