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

  create: (data: Partial<Team> & { division_ids?: string[] }) =>
    apiClient.post<Team>('/teams', data),

  update: (id: string, data: Partial<Team>) =>
    apiClient.patch<Team>(`/teams/${id}`, data),

  addToDivision: (
    id: string,
    data: { division_id: string; slug?: string; group_id?: string | null },
  ) => apiClient.post<Team>(`/teams/${id}/divisions`, data),

  removeFromDivision: (id: string, divisionId: string) =>
    apiClient.delete<{ team_id: string; division_id: string }>(
      `/teams/${id}/divisions/${divisionId}`,
    ),

  /** Soft delete (decommission). */
  delete: (id: string) => apiClient.delete<Team>(`/teams/${id}`),

  restore: (id: string) => apiClient.post<Team>(`/teams/${id}/restore`),

  /** Permanent hard delete (admin). */
  purge: (id: string) => apiClient.delete<{ id: string }>(`/teams/${id}/purge`),

  history: (id: string) => apiClient.get<RecordVersion[]>(`/teams/${id}/history`),

  restoreVersion: (id: string, versionId: string) =>
    apiClient.post<Team>(`/teams/${id}/restore-version/${versionId}`),
};
