import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { BracketSnapshot } from '@/lib/bracket-utils';
import { bracketsService } from '@/services/brackets.service';

export function useBracket(divisionId?: string) {
  return useQuery({
    queryKey: queryKeys.brackets.byDivision(divisionId ?? ''),
    queryFn: async () => (await bracketsService.getByDivisionId(divisionId!)).data,
    enabled: !!divisionId,
  });
}

function invalidateBrackets(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['brackets'] });
}

export function useGenerateBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      divisionId,
      bracketSize,
    }: {
      divisionId: string;
      bracketSize?: number;
    }) => bracketsService.generate(divisionId, { bracket_size: bracketSize }),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function useRandomizeBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divisionId: string) => bracketsService.randomize(divisionId),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function usePlaceBracketTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      nodeId,
      teamId,
      slot,
    }: {
      nodeId: string;
      teamId: string;
      slot: 'home' | 'away';
    }) => bracketsService.placeTeam(nodeId, teamId, slot),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function usePlaceBracketSlotSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      nodeId,
      slot,
      sourceMatchId,
      outcome,
    }: {
      nodeId: string;
      slot: 'home' | 'away';
      sourceMatchId: string;
      outcome: 'WINNER' | 'LOSER';
    }) => bracketsService.placeSlotSource(nodeId, slot, sourceMatchId, outcome),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function useRestoreBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      divisionId,
      snapshot,
    }: {
      divisionId: string;
      snapshot: BracketSnapshot;
    }) => bracketsService.restore(divisionId, snapshot),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function useSetBracketLock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ divisionId, locked }: { divisionId: string; locked: boolean }) =>
      bracketsService.setLock(divisionId, locked),
    onSuccess: () => {
      invalidateBrackets(qc);
      qc.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}

export function useFinalizeBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divisionId: string) => bracketsService.finalize(divisionId),
    onSuccess: () => {
      invalidateBrackets(qc);
      qc.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}

export function useUnfinalizeBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divisionId: string) => bracketsService.unfinalize(divisionId),
    onSuccess: () => {
      invalidateBrackets(qc);
      qc.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}

export function useSwapBracketMatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeIdA, nodeIdB }: { nodeIdA: string; nodeIdB: string }) =>
      bracketsService.swapMatches(nodeIdA, nodeIdB),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function useAssignBracketTeams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ divisionId, teamIds }: { divisionId: string; teamIds: string[] }) =>
      bracketsService.assignTeams(divisionId, teamIds),
    onSuccess: () => invalidateBrackets(qc),
  });
}

export function useValidateBracket(divisionId?: string, bracketSize?: number) {
  return useQuery({
    queryKey: ['brackets', 'validate', divisionId ?? '', bracketSize ?? 'auto'],
    queryFn: async () => (await bracketsService.validate(divisionId!, bracketSize)).data,
    enabled: !!divisionId,
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
    onSuccess: () => invalidateBrackets(qc),
  });
}
