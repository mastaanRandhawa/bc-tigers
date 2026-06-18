import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { standingsService } from '@/services/standings.service';

export function useRecalculateStandings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divisionId: string) => standingsService.recalculate(divisionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['standings'] });
      qc.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}
