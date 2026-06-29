import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { teamsService } from '@/services/teams.service';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import type { RecordScope, Team } from '@/types';

export function useTeams(params?: { divisionId?: string; scope?: RecordScope }) {
  const canAdmin = useCanAdminEdit();
  return useQuery({
    queryKey: queryKeys.teams.all(params),
    queryFn: async () => (await teamsService.getAll(params)).data,
    enabled: canAdmin,
  });
}

/** Invalidate both the global team lists and division-scoped resource trees. */
function invalidateTeams(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['teams'] });
  qc.invalidateQueries({ queryKey: ['divisions'] });
  qc.invalidateQueries({ queryKey: ['users'] });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team> & { division_ids?: string[] }) =>
      teamsService.create(data),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useAddTeamToDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: { division_id: string; slug?: string; group_id?: string | null };
    }) => teamsService.addToDivision(teamId, data),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useRemoveTeamFromDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, divisionId }: { teamId: string; divisionId: string }) =>
      teamsService.removeFromDivision(teamId, divisionId),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Team> }) =>
      teamsService.update(id, data),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamsService.delete(id),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useRestoreTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamsService.restore(id),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function usePurgeTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamsService.purge(id),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useRestoreTeamVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      teamsService.restoreVersion(id, versionId),
    onSuccess: () => invalidateTeams(qc),
  });
}
