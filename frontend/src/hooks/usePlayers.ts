import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { playersService } from '@/services/players.service';
import type { Player } from '@/types';

export function usePlayers(params?: { teamId?: string }) {
  return useQuery({
    queryKey: queryKeys.players.all(params),
    queryFn: async () => (await playersService.getAll(params)).data,
  });
}

function invalidatePlayerCaches(qc: ReturnType<typeof useQueryClient>) {
  // Invalidate standalone player list (admin portal)
  qc.invalidateQueries({ queryKey: ['players'] });
  // Invalidate all division-team queries — they embed player data in rosters
  qc.invalidateQueries({ queryKey: ['divisions'] });
  // Invalidate roster queries
  qc.invalidateQueries({ queryKey: ['rosters'] });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Player>) => playersService.create(data),
    onSuccess: () => invalidatePlayerCaches(qc),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Player> }) =>
      playersService.update(id, data),
    onSuccess: () => invalidatePlayerCaches(qc),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playersService.delete(id),
    onSuccess: () => invalidatePlayerCaches(qc),
  });
}
