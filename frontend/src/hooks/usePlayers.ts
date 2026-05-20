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

export function usePlayer(slug?: string) {
  return useQuery({
    queryKey: queryKeys.players.detail(slug ?? ''),
    queryFn: async () => (await playersService.getOne(slug!)).data,
    enabled: !!slug,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Player>) => playersService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Player> }) =>
      playersService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playersService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
}
