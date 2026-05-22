import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { statsService } from '@/services/stats.service';

export function useTopScorers(params?: { tournamentId?: string; divisionId?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.stats.topScorers(params),
    queryFn: async () => (await statsService.topScorers(params)).data,
  });
}

