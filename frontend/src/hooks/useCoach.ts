import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService, type CoachTeamResponse } from '@/services/coach.service';
import type { Player, Team } from '@/types';

function isAssignedTeam(
  data: CoachTeamResponse | undefined,
): data is CoachTeamResponse & Team & { assigned: true } {
  return !!data && data.assigned !== false && 'id' in data;
}

export function useCoachMe() {
  return useQuery({
    queryKey: ['coach', 'me'],
    queryFn: async () => (await coachService.me()).data,
  });
}

export function useCoachTeam() {
  return useQuery({
    queryKey: ['coach', 'team'],
    queryFn: async () => (await coachService.getTeam()).data,
  });
}

export function useCoachTeamData() {
  const query = useCoachTeam();
  const team = isAssignedTeam(query.data) ? query.data : null;
  return { ...query, team, coachData: query.data };
}

export function useUpdateCoachTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team>) => coachService.updateTeam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach', 'team'] });
    },
  });
}

export function useCoachPlayers(enabled = true) {
  return useQuery({
    queryKey: ['coach', 'players'],
    queryFn: async () => (await coachService.getPlayers()).data,
    enabled,
  });
}

export function useCreateCoachPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Player>) => coachService.createPlayer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', 'players'] }),
  });
}

export function useUpdateCoachPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: Partial<Player> }) =>
      coachService.updatePlayer(playerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', 'players'] }),
  });
}

export function useDeleteCoachPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => coachService.deletePlayer(playerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', 'players'] }),
  });
}
