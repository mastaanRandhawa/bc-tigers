import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { coachService, type CoachTeamResponse } from '@/services/coach.service';
import type { Player, Team } from '@/types';
import {
  scheduledCoachLockPollInterval,
  useScheduledCoachLockRefetch,
} from '@/hooks/useScheduledCoachLockWatch';

const COACH_TEAM_KEY = 'coach-selected-team-id';

function isAssignedTeam(
  data: CoachTeamResponse | undefined,
): data is CoachTeamResponse & Team & { assigned: true } {
  return !!data && data.assigned !== false && 'id' in data;
}

export function useSelectedCoachTeamId(teamIds: string[] | undefined) {
  const [selected, setSelected] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return teamIds?.[0];
    const stored = localStorage.getItem(COACH_TEAM_KEY);
    if (stored && teamIds?.includes(stored)) return stored;
    return teamIds?.[0];
  });

  useEffect(() => {
    if (!teamIds?.length) {
      setSelected(undefined);
      return;
    }
    if (selected && teamIds.includes(selected)) return;
    const next = teamIds[0];
    setSelected(next);
    if (next) localStorage.setItem(COACH_TEAM_KEY, next);
  }, [teamIds, selected]);

  const selectTeam = (id: string) => {
    setSelected(id);
    localStorage.setItem(COACH_TEAM_KEY, id);
  };

  return { selectedTeamId: selected, selectTeam };
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

export function useCoachTeams() {
  return useQuery({
    queryKey: ['coach', 'teams'],
    queryFn: async () => (await coachService.listTeams()).data,
  });
}

export function useCoachTeamRequests() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['coach', 'team-requests'],
    queryFn: async () => (await coachService.listTeamRequests()).data,
  });

  const create = useMutation({
    mutationFn: (teamId: string) => coachService.createTeamRequest(teamId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach', 'team-requests'] }),
  });

  return { ...query, createRequest: create };
}

export function useCoachTeam(teamId?: string) {
  const query = useQuery({
    queryKey: ['coach', 'team', teamId ?? 'default'],
    queryFn: async () => (await coachService.getTeam(teamId)).data,
    enabled: teamId !== undefined || true,
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

export function useCoachTeamData(teamId?: string) {
  const query = useCoachTeam(teamId);
  const team = isAssignedTeam(query.data) ? query.data : null;
  return { ...query, team, coachData: query.data };
}

export function useUpdateCoachTeam(teamId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team>) => coachService.updateTeam(data, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach', 'team'] });
    },
  });
}

export function useCoachPlayers(teamId?: string, enabled = true) {
  return useQuery({
    queryKey: ['coach', 'players', teamId ?? 'default'],
    queryFn: async () => (await coachService.getPlayers(teamId)).data,
    enabled: enabled && !!teamId,
  });
}

export function useCreateCoachPlayer(teamId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Player>) => coachService.createPlayer(data, teamId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['coach', 'players', teamId ?? 'default'] }),
  });
}

export function useUpdateCoachPlayer(teamId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: Partial<Player> }) =>
      coachService.updatePlayer(playerId, data, teamId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['coach', 'players', teamId ?? 'default'] }),
  });
}

export function useCoachMatches(teamId?: string, enabled = true) {
  return useQuery({
    queryKey: ['coach', 'matches', teamId ?? 'default'],
    queryFn: async () => (await coachService.getMatches(teamId)).data,
    enabled: enabled && !!teamId,
  });
}

export function useDeleteCoachPlayer(teamId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => coachService.deletePlayer(playerId, teamId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['coach', 'players', teamId ?? 'default'] }),
  });
}
