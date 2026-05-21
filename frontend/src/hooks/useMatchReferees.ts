import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { matchesService } from '@/services/matches.service';

export function useAssignMatchReferee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      refereeId,
      role,
    }: {
      matchId: string;
      refereeId: string;
      role?: string;
    }) => matchesService.assignReferee(matchId, { referee_id: refereeId, role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useRemoveMatchReferee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      matchRefereeId,
    }: {
      matchId: string;
      matchRefereeId: string;
    }) => matchesService.removeReferee(matchId, matchRefereeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}
