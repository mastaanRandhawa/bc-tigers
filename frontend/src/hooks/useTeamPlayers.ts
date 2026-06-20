import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamPlayersService } from '@/services/team-players.service';
import type { Player } from '@/types';

export function useTeamPlayers(teamId?: string) {
  return useQuery({
    queryKey: ['teams', teamId, 'players'],
    queryFn: async () => (await teamPlayersService.getByTeam(teamId!)).data,
    enabled: !!teamId,
  });
}

export function useCreateTeamPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: Partial<Player> }) =>
      teamPlayersService.create(teamId, data),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'players'] });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeamPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      playerId,
      data,
    }: {
      teamId: string;
      playerId: string;
      data: Partial<Player>;
    }) => teamPlayersService.update(teamId, playerId, data),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'players'] });
    },
  });
}

export function useDeleteTeamPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, playerId }: { teamId: string; playerId: string }) =>
      teamPlayersService.remove(teamId, playerId),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'players'] });
    },
  });
}
