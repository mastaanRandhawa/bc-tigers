import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldsService } from '@/services/fields.service';
import type { Field } from '@/types';

const fieldKeys = {
  byVenue: (venueId: string) => ['fields', 'venue', venueId] as const,
};

export function useFields(venueId?: string) {
  return useQuery({
    queryKey: fieldKeys.byVenue(venueId ?? ''),
    queryFn: async () => (await fieldsService.getByVenue(venueId!)).data,
    enabled: !!venueId,
  });
}

export function useCreateField(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; surface?: string; capacity?: number }) =>
      fieldsService.create(venueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldKeys.byVenue(venueId) });
      qc.invalidateQueries({ queryKey: ['venues'] });
    },
  });
}

export function useUpdateField(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Field> }) =>
      fieldsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldKeys.byVenue(venueId) });
      qc.invalidateQueries({ queryKey: ['venues'] });
    },
  });
}

export function useDeleteField(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fieldsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldKeys.byVenue(venueId) });
      qc.invalidateQueries({ queryKey: ['venues'] });
    },
  });
}
