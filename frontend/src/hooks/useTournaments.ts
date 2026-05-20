import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { queryTiming } from '@/lib/query-options';
import { tournamentsService } from '@/services/tournaments.service';
import type { Tournament } from '@/types';

export function useTournaments(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.tournaments.all(params),
    queryFn: async () => (await tournamentsService.getAll(params)).data,
    ...queryTiming.feed,
  });
}

export function useTournament(slug?: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.detail(slug ?? ''),
    queryFn: async () => (await tournamentsService.getOne(slug!)).data,
    enabled: !!slug,
    ...queryTiming.feed,
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tournament>) => tournamentsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tournament> }) =>
      tournamentsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });
}

export function useDeleteTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });
}
