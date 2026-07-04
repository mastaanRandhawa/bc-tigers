import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { queryTiming } from '@/lib/query-options';
import { matchesService } from '@/services/matches.service';
import { hubService } from '@/services/hub.service';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import type { Match, MatchEventType } from '@/types';

function invalidateMatchLists(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['matches'] });
  qc.invalidateQueries({ queryKey: queryKeys.matches.live });
  qc.invalidateQueries({ queryKey: queryKeys.hub.home });
  // Division-scoped lists (matches, standings, overview) are cached under the
  // ['divisions', ...] tree, not ['matches']. Without this, an admin editing a
  // match inline on a division page (or deleting one) sees a stale list until a
  // manual reload.
  qc.invalidateQueries({ queryKey: ['divisions'] });
}

export function useMatches(params?: {
  status?: string;
  tournamentId?: string;
  divisionId?: string;
  limit?: number;
}) {
  const isLive = params?.status === 'LIVE';
  return useQuery({
    queryKey: queryKeys.matches.all(params),
    queryFn: async () => (await matchesService.getAll(params)).data,
    ...(isLive ? queryTiming.live : queryTiming.standard),
  });
}

export function useLiveMatches(params?: { divisionId?: string }) {
  return useQuery({
    queryKey: [...queryKeys.matches.live, params?.divisionId ?? 'all'],
    queryFn: async () =>
      (await hubService.getLiveMatches(params?.divisionId)).data,
    ...queryTiming.live,
  });
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

    const handleUpdate = (data: { matchId?: string }) => {
      if (data.matchId === id || !data.matchId) {
        qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
        invalidateMatchLists(qc);
      }
    };

    socket.on(SOCKET_EVENTS.MATCH_UPDATED, handleUpdate);
    socket.on(SOCKET_EVENTS.MATCH_COMPLETED, handleUpdate);
    socket.on(SOCKET_EVENTS.GOAL_SCORED, handleUpdate);
    socket.on(SOCKET_EVENTS.CARD_ISSUED, handleUpdate);
    socket.on(SOCKET_EVENTS.SUBSTITUTION, handleUpdate);

    return () => {
      socket.emit('leave:match', id);
      socket.off(SOCKET_EVENTS.MATCH_UPDATED, handleUpdate);
      socket.off(SOCKET_EVENTS.MATCH_COMPLETED, handleUpdate);
      socket.off(SOCKET_EVENTS.GOAL_SCORED, handleUpdate);
      socket.off(SOCKET_EVENTS.CARD_ISSUED, handleUpdate);
      socket.off(SOCKET_EVENTS.SUBSTITUTION, handleUpdate);
    };
  }, [id, qc]);

  return query;
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Match>) => matchesService.create(data),
    onSuccess: () => invalidateMatchLists(qc),
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) =>
      matchesService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      invalidateMatchLists(qc);
    },
  });
}

export function useUpdateMatchScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      home,
      away,
      home_penalties,
      away_penalties,
    }: {
      id: string;
      home: number;
      away: number;
      home_penalties?: number | null;
      away_penalties?: number | null;
    }) =>
      matchesService.updateScore(id, home, away, {
        home_penalties,
        away_penalties,
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      invalidateMatchLists(qc);
    },
  });
}

export function useUpdateMatchScoreOptimistic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, home, away }: { id: string; home: number; away: number }) =>
      matchesService.updateScore(id, home, away),
    onMutate: async ({ id, home, away }) => {
      await qc.cancelQueries({ queryKey: queryKeys.matches.detail(id) });
      const previous = qc.getQueryData<Match>(queryKeys.matches.detail(id));
      if (previous) {
        qc.setQueryData<Match>(queryKeys.matches.detail(id), {
          ...previous,
          home_score: home,
          away_score: away,
        });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.matches.detail(id), context.previous);
      }
    },
    onSettled: (_, __, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      invalidateMatchLists(qc);
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
      invalidateMatchLists(qc);
    },
  });
}

export function useUpdateMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      eventId,
      data,
    }: {
      matchId: string;
      eventId: string;
      data: {
        player_id?: string | null;
        team_id?: string;
        type?: MatchEventType;
        minute?: number;
        extra_time?: number | null;
      };
    }) => matchesService.updateEvent(matchId, eventId, data),
    onSuccess: (_, { matchId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(matchId) });
      invalidateMatchLists(qc);
    },
  });
}

export function useDeleteMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, eventId }: { matchId: string; eventId: string }) =>
      matchesService.deleteEvent(matchId, eventId),
    onSuccess: (_, { matchId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(matchId) });
      invalidateMatchLists(qc);
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matchesService.delete(id),
    onSuccess: () => invalidateMatchLists(qc),
  });
}

/** Invalidate caches when standings or brackets change. */
export function useRealtimeInvalidation() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const onStandings = () => {
      qc.invalidateQueries({ queryKey: ['standings'] });
      qc.invalidateQueries({ queryKey: ['divisions'] });
    };
    const onBracket = () => {
      qc.invalidateQueries({ queryKey: ['brackets'] });
      qc.invalidateQueries({ queryKey: ['divisions'] });
    };

    socket.on(SOCKET_EVENTS.STANDINGS_UPDATED, onStandings);
    socket.on(SOCKET_EVENTS.BRACKET_UPDATED, onBracket);

    return () => {
      socket.off(SOCKET_EVENTS.STANDINGS_UPDATED, onStandings);
      socket.off(SOCKET_EVENTS.BRACKET_UPDATED, onBracket);
    };
  }, [qc]);
}
