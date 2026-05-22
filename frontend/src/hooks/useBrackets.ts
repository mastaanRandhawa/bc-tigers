import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { bracketsService } from '@/services/brackets.service';

export function useBracket(divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.brackets.byDivision(divisionSlug ?? ''),
    queryFn: async () => (await bracketsService.getByDivision(divisionSlug!)).data,
    enabled: !!divisionSlug,
  });
}

export function useGenerateBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divisionId: string) => bracketsService.generate(divisionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brackets'] }),
  });
}

export function useAdvanceBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, winnerId }: { nodeId: string; winnerId: string }) =>
      bracketsService.advance(nodeId, winnerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brackets'] }),
  });
}

export function useUpdateBracketNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      nodeId,
      data,
    }: {
      nodeId: string;
      data: { home_team_id?: string | null; away_team_id?: string | null };
    }) => bracketsService.updateNode(nodeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brackets'] }),
  });
}
