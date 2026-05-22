import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { usersService } from '@/services/users.service';
import type { User, UserRole } from '@/types';

export function useUsers(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.users.all(params),
    queryFn: async () => (await usersService.getAll(params)).data,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { role?: UserRole } }) =>
      usersService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useLinkUserEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { entity_type: 'player' | 'coach' | 'referee'; entity_id: string };
    }) => usersService.linkEntity(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
