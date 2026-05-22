import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { refereesService } from '@/services/referees.service';
import type { Referee } from '@/types';

export function useReferees() {
  return useQuery({
    queryKey: queryKeys.referees.all(),
    queryFn: async () => (await refereesService.getAll()).data,
  });
}

export function useCreateReferee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Referee>) => refereesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referees'] }),
  });
}

export function useUpdateReferee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Referee> }) =>
      refereesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referees'] }),
  });
}

export function useDeleteReferee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => refereesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referees'] }),
  });
}
