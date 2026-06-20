import apiClient from '@/lib/api-client';
import type { Player } from '@/types';

export const teamPlayersService = {
  getByTeam: (teamId: string) => apiClient.get<Player[]>(`/teams/${teamId}/players`),

  create: (teamId: string, data: Partial<Player>) =>
    apiClient.post<Player>(`/teams/${teamId}/players`, data),

  update: (teamId: string, playerId: string, data: Partial<Player>) =>
    apiClient.patch<Player>(`/teams/${teamId}/players/${playerId}`, data),

  remove: (teamId: string, playerId: string) =>
    apiClient.delete(`/teams/${teamId}/players/${playerId}`),
};
