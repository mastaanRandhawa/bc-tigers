import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { standingsService } from '@/services/standings.service';

export function useStandings(divisionId?: string) {
  return useQuery({
    queryKey: queryKeys.standings.byDivision(divisionId ?? ''),
    queryFn: async () => (await standingsService.getByDivision(divisionId!)).data,
    enabled: !!divisionId,
  });
}

export function useRecalculateStandings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divisionId: string) => standingsService.recalculate(divisionId),
    onSuccess: (_, divisionId) => {
      qc.invalidateQueries({ queryKey: queryKeys.standings.byDivision(divisionId) });
    },
  });
}
