import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { venuesService } from '@/services/venues.service';
import type { Venue } from '@/types';

export function useVenues() {
  return useQuery({
    queryKey: queryKeys.venues.all(),
    queryFn: async () => (await venuesService.getAll()).data,
  });
}

export function useVenue(slug?: string) {
  return useQuery({
    queryKey: queryKeys.venues.detail(slug ?? ''),
    queryFn: async () => (await venuesService.getOne(slug!)).data,
    enabled: !!slug,
  });
}

export function useCreateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Venue>) => venuesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });
}

export function useUpdateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Venue> }) =>
      venuesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });
}

export function useDeleteVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => venuesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });
}
