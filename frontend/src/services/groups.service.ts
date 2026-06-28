import apiClient from '@/lib/api-client';
import type { Group } from '@/types';

export interface GroupAssignment {
  team_id: string;
  group_id: string | null;
}

export const groupsService = {
  listByDivision: (divisionId: string) =>
    apiClient.get<Group[]>(`/divisions/${divisionId}/groups`),

  create: (divisionId: string, data: { name: string; slug?: string }) =>
    apiClient.post<Group>(`/divisions/${divisionId}/groups`, data),

  update: (id: string, data: { name?: string; slug?: string; order?: number }) =>
    apiClient.patch<Group>(`/groups/${id}`, data),

  remove: (id: string) => apiClient.delete<{ id: string }>(`/groups/${id}`),

  reorder: (divisionId: string, order: string[]) =>
    apiClient.post<Group[]>(`/divisions/${divisionId}/groups/reorder`, { order }),

  assignTeams: (divisionId: string, assignments: GroupAssignment[]) =>
    apiClient.post<Group[]>(`/divisions/${divisionId}/groups/assign`, {
      assignments,
    }),
};
