import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { statsService } from '@/services/stats.service';

export function useTopScorers(params?: { tournamentId?: string; divisionId?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.stats.topScorers(params),
    queryFn: async () => (await statsService.topScorers(params)).data,
  });
}

export function useTopAssists(params?: { tournamentId?: string; divisionId?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.stats.topAssists(params),
    queryFn: async () => (await statsService.topAssists(params)).data,
  });
}

export function useDisciplineStats(params?: { tournamentId?: string; divisionId?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.stats.discipline(params),
    queryFn: async () => (await statsService.discipline(params)).data,
  });
}

export function useStatsSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: async () => (await statsService.summary()).data,
  });
}
