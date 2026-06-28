import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { queryTiming } from '@/lib/query-options';
import { tournamentsService } from '@/services/tournaments.service';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import type { RecordScope, Tournament } from '@/types';

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

export function useTournamentById(id?: string) {
  return useQuery({
    queryKey: ['tournaments', 'by-id', id ?? ''],
    queryFn: async () => (await tournamentsService.getById(id!)).data,
    enabled: !!id,
    ...queryTiming.feed,
  });
}

export function useTournamentOverview(slug?: string) {
  return useQuery({
    queryKey: [...queryKeys.tournaments.detail(slug ?? ''), 'overview'],
    queryFn: async () => (await tournamentsService.getOverview(slug!)).data,
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

function invalidateTournamentQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tournaments'] });
  qc.invalidateQueries({ queryKey: queryKeys.hub.home });
}

export function useDeleteTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsService.delete(id),
    onSuccess: () => invalidateTournamentQueries(qc),
  });
}

/** Admin list with active/deleted/all scope (gated to admins). */
export function useManagedTournaments(scope: RecordScope) {
  const canAdmin = useCanAdminEdit();
  return useQuery({
    queryKey: ['tournaments', 'manage', scope],
    queryFn: async () => (await tournamentsService.getManaged(scope)).data,
    enabled: canAdmin,
  });
}

export function useRestoreTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });
}

export function usePurgeTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsService.purge(id),
    onSuccess: () => invalidateTournamentQueries(qc),
  });
}

export function useRestoreTournamentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      tournamentsService.restoreVersion(id, versionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });
}
