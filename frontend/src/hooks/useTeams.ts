import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { teamsService } from '@/services/teams.service';
import type { Team } from '@/types';

export function useTeams(params?: { divisionId?: string }) {
  return useQuery({
    queryKey: queryKeys.teams.all(params),
    queryFn: async () => (await teamsService.getAll(params)).data,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team>) => teamsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Team> }) =>
      teamsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
}
