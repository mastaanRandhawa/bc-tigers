import apiClient from '@/lib/api-client';
import type { PlayerStat, StatsSummary } from '@/types';

export const statsService = {
  topScorers: (params?: { tournamentId?: string; divisionId?: string; limit?: number }) =>
    apiClient.get<PlayerStat[]>('/stats/top-scorers', { params }),

  topAssists: (params?: { tournamentId?: string; divisionId?: string; limit?: number }) =>
    apiClient.get<PlayerStat[]>('/stats/top-assists', { params }),

  discipline: (params?: { tournamentId?: string; divisionId?: string; limit?: number }) =>
    apiClient.get<PlayerStat[]>('/stats/discipline', { params }),

  summary: () => apiClient.get<StatsSummary>('/stats/summary'),
};
