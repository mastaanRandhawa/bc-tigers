import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { pointFormatsService } from '@/services/point-formats.service';
import type { PointFormat } from '@/types';

export function usePointFormats() {
  return useQuery({
    queryKey: queryKeys.pointFormats.all(),
    queryFn: async () => (await pointFormatsService.getAll()).data,
  });
}

export function useCreatePointFormat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PointFormat>) => pointFormatsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['point-formats'] }),
  });
}

export function useUpdatePointFormat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PointFormat> }) =>
      pointFormatsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['point-formats'] }),
  });
}

export function useDeletePointFormat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pointFormatsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['point-formats'] }),
  });
}
