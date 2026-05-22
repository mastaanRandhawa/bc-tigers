import apiClient from '@/lib/api-client';
import type { TeamRoster } from '@/types';

export const rostersService = {
  getByTeam: (teamId: string) => apiClient.get<TeamRoster[]>(`/teams/${teamId}/rosters`),
  add: (teamId: string, data: { player_id: string; season?: string; active?: boolean }) =>
    apiClient.post<TeamRoster>(`/teams/${teamId}/rosters`, data),
  update: (teamId: string, rosterId: string, data: { active?: boolean; season?: string }) =>
    apiClient.patch<TeamRoster>(`/teams/${teamId}/rosters/${rosterId}`, data),
  remove: (teamId: string, rosterId: string) =>
    apiClient.delete(`/teams/${teamId}/rosters/${rosterId}`),
};
