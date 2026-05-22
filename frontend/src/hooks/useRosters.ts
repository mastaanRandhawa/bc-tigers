import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rostersService } from '@/services/rosters.service';

export function useTeamRoster(teamId?: string) {
  return useQuery({
    queryKey: ['rosters', teamId],
    queryFn: async () => (await rostersService.getByTeam(teamId!)).data,
    enabled: !!teamId,
  });
}

export function useAddToRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: { player_id: string; season?: string; active?: boolean };
    }) => rostersService.add(teamId, data),
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ['rosters', teamId] }),
  });
}

export function useUpdateRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      rosterId,
      data,
    }: {
      teamId: string;
      rosterId: string;
      data: { active?: boolean; season?: string };
    }) => rostersService.update(teamId, rosterId, data),
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ['rosters', teamId] }),
  });
}

export function useRemoveFromRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, rosterId }: { teamId: string; rosterId: string }) =>
      rostersService.remove(teamId, rosterId),
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ['rosters', teamId] }),
  });
}
