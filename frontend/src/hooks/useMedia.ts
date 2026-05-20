import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { mediaService } from '@/services/media.service';
import type { Media } from '@/types';

export function useMedia(params?: { tournamentId?: string; divisionId?: string }) {
  return useQuery({
    queryKey: queryKeys.media.all(params),
    queryFn: async () => (await mediaService.getAll(params)).data,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof mediaService.upload>[0]) => mediaService.upload(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export type { Media };
