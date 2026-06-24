import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService, type CoachTeamResponse } from '@/services/coach.service';
import type { Player, Team } from '@/types';
import {
  scheduledCoachLockPollInterval,
  useScheduledCoachLockRefetch,
} from '@/hooks/useScheduledCoachLockWatch';

function isAssignedTeam(
  data: CoachTeamResponse | undefined,
): data is CoachTeamResponse & Team & { assigned: true } {
  return !!data && data.assigned !== false && 'id' in data;
}

export function useCoachMe() {
  const query = useQuery({
    queryKey: ['coach', 'me'],
    queryFn: async () => (await coachService.me()).data,
    refetchInterval: (q) =>
      scheduledCoachLockPollInterval(q.state.data?.coach_lock_scheduled_pending),
  });

  useScheduledCoachLockRefetch(
    query.data?.coach_lock_scheduled_at,
    query.data?.coach_lock_scheduled_pending,
    query.refetch,
  );

  return query;
}

export function useCoachTeam() {
  const query = useQuery({
    queryKey: ['coach', 'team'],
    queryFn: async () => (await coachService.getTeam()).data,
    refetchInterval: (q) =>
      scheduledCoachLockPollInterval(q.state.data?.coach_lock_scheduled_pending),
  });

  useScheduledCoachLockRefetch(
    query.data?.coach_lock_scheduled_at,
    query.data?.coach_lock_scheduled_pending,
    query.refetch,
  );

  return query;
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

export function useCoachMatches(enabled = true) {
  return useQuery({
    queryKey: ['coach', 'matches'],
    queryFn: async () => (await coachService.getMatches()).data,
    enabled,
  });
}

export function useDeleteCoachPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => coachService.deletePlayer(playerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', 'players'] }),
  });
}
