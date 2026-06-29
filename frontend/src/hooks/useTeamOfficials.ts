import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamOfficialsService } from '@/services/team-officials.service';
import type { TeamOfficial } from '@/types';

export const MAX_OFFICIALS_PER_TEAM = 4;

export function useTeamOfficials(teamId?: string) {
  return useQuery({
    queryKey: ['teams', teamId, 'officials'],
    queryFn: async () => (await teamOfficialsService.getByTeam(teamId!)).data,
    enabled: !!teamId,
  });
}

export function useCreateTeamOfficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: Partial<TeamOfficial> }) =>
      teamOfficialsService.create(teamId, data),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'officials'] });
    },
  });
}

export function useUpdateTeamOfficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      officialId,
      data,
    }: {
      teamId: string;
      officialId: string;
      data: Partial<TeamOfficial>;
    }) => teamOfficialsService.update(teamId, officialId, data),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'officials'] });
    },
  });
}

export function useDeleteTeamOfficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, officialId }: { teamId: string; officialId: string }) =>
      teamOfficialsService.remove(teamId, officialId),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'officials'] });
    },
  });
}
