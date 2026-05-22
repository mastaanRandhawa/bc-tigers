import apiClient from '@/lib/api-client';
import type { Match } from '@/types';

export const meService = {
  getMatches: (params?: { status?: string; limit?: number }) =>
    apiClient.get<Match[]>('/me/matches', { params }),
  getMatch: (id: string) => apiClient.get<Match>(`/me/matches/${id}`),
};
