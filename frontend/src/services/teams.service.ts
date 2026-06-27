import apiClient from '@/lib/api-client';
import type { RecordScope, RecordVersion, Team } from '@/types';

export interface TeamDirectoryEntry {
  id: string;
  name: string;
  division: {
    id: string;
    name: string;
    slug: string;
    tournament: { name: string; slug: string };
  };
}

export const teamsService = {
  getAll: (params?: { divisionId?: string; scope?: RecordScope }) =>
    apiClient.get<Team[]>('/teams', { params }),

  /** Public — teams without a coach, for the coach-registration picker. */
  directory: () => apiClient.get<TeamDirectoryEntry[]>('/teams/directory'),

  create: (data: Partial<Team>) => apiClient.post<Team>('/teams', data),

  update: (id: string, data: Partial<Team>) =>
    apiClient.patch<Team>(`/teams/${id}`, data),

  /** Soft delete (decommission). */
  delete: (id: string) => apiClient.delete<Team>(`/teams/${id}`),

  restore: (id: string) => apiClient.post<Team>(`/teams/${id}/restore`),

  /** Permanent hard delete (admin). */
  purge: (id: string) => apiClient.delete<{ id: string }>(`/teams/${id}/purge`),

  history: (id: string) => apiClient.get<RecordVersion[]>(`/teams/${id}/history`),

  restoreVersion: (id: string, versionId: string) =>
    apiClient.post<Team>(`/teams/${id}/restore-version/${versionId}`),
};
