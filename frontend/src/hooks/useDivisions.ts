import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { divisionsService } from '@/services/divisions.service';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import type { Division } from '@/types';

export function useDivisions() {
  const canAdmin = useCanAdminEdit();
  return useQuery({
    queryKey: queryKeys.divisions.all(),
    queryFn: async () => (await divisionsService.getAll()).data,
    enabled: canAdmin,
  });
}

export function useDivision(tournamentSlug?: string, divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.detail(tournamentSlug ?? '', divisionSlug ?? ''),
    queryFn: async () =>
      (await divisionsService.getOne(tournamentSlug!, divisionSlug!)).data,
    enabled: !!tournamentSlug && !!divisionSlug,
  });
}

export function useCreateDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Division>) => divisionsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['divisions'] }),
  });
}

export function useUpdateDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Division> }) =>
      divisionsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['divisions'] }),
  });
}

export function useDeleteDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => divisionsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['divisions'] }),
  });
}

export function useGenerateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      force,
    }: {
      id: string;
      body?: Parameters<typeof divisionsService.generateSchedule>[1];
      force?: boolean;
    }) => divisionsService.generateSchedule(id, body, force),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}
