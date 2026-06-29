import apiClient from '@/lib/api-client';
import type { TeamOfficial } from '@/types';

export const teamOfficialsService = {
  getByTeam: (teamId: string) =>
    apiClient.get<TeamOfficial[]>(`/teams/${teamId}/officials`),

  create: (teamId: string, data: Partial<TeamOfficial>) =>
    apiClient.post<TeamOfficial>(`/teams/${teamId}/officials`, data),

  update: (teamId: string, officialId: string, data: Partial<TeamOfficial>) =>
    apiClient.patch<TeamOfficial>(`/teams/${teamId}/officials/${officialId}`, data),

  remove: (teamId: string, officialId: string) =>
    apiClient.delete(`/teams/${teamId}/officials/${officialId}`),
};
