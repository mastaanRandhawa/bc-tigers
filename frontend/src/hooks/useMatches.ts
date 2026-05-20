import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { matchesService } from '@/services/matches.service';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import type { Match, MatchEventType } from '@/types';

export function useMatches(params?: {
  status?: string;
  tournamentId?: string;
  divisionId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.matches.all(params),
    queryFn: async () => (await matchesService.getAll(params)).data,
  });
}

export function useLiveMatches(params?: { divisionId?: string }) {
  const query = useMatches({ status: 'LIVE', divisionId: params?.divisionId });
  return {
    ...query,
    data: query.data?.filter((m) => m.status === 'LIVE') ?? [],
  };
}

export function useMatch(id?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.matches.detail(id ?? ''),
    queryFn: async () => (await matchesService.getOne(id!)).data,
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    socket.emit('join:match', id);

    const handleUpdate = (data: { matchId?: string; home_score?: number; away_score?: number }) => {
      if (data.matchId === id || !data.matchId) {
        qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
        qc.invalidateQueries({ queryKey: ['matches'] });
      }
    };

    socket.on(SOCKET_EVENTS.MATCH_UPDATED, handleUpdate);
    socket.on(SOCKET_EVENTS.MATCH_COMPLETED, handleUpdate);
    socket.on(SOCKET_EVENTS.GOAL_SCORED, handleUpdate);

    return () => {
      socket.emit('leave:match', id);
      socket.off(SOCKET_EVENTS.MATCH_UPDATED, handleUpdate);
      socket.off(SOCKET_EVENTS.MATCH_COMPLETED, handleUpdate);
      socket.off(SOCKET_EVENTS.GOAL_SCORED, handleUpdate);
    };
  }, [id, qc]);

  return query;
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Match>) => matchesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) =>
      matchesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useUpdateMatchScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, home, away }: { id: string; home: number; away: number }) =>
      matchesService.updateScore(id, home, away),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useAddMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: string;
      data: {
        player_id?: string;
        team_id: string;
        type: MatchEventType;
        minute: number;
        extra_time?: number;
      };
    }) => matchesService.addEvent(matchId, data),
    onSuccess: (_, { matchId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(matchId) });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matchesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}
