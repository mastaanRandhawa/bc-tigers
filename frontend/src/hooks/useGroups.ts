import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { groupsService, type GroupAssignment } from '@/services/groups.service';

export function useDivisionGroups(divisionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.byDivision(divisionId ?? ''),
    queryFn: async () => (await groupsService.listByDivision(divisionId!)).data,
    enabled: !!divisionId && enabled,
  });
}

function useInvalidateGroups(divisionId?: string) {
  const qc = useQueryClient();
  return () => {
    if (divisionId) {
      qc.invalidateQueries({ queryKey: queryKeys.groups.byDivision(divisionId) });
    }
    qc.invalidateQueries({ queryKey: ['divisions'] });
    qc.invalidateQueries({ queryKey: ['standings'] });
  };
}

export function useCreateGroup(divisionId: string) {
  const invalidate = useInvalidateGroups(divisionId);
  return useMutation({
    mutationFn: (data: { name: string; slug?: string }) =>
      groupsService.create(divisionId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateGroup(divisionId: string) {
  const invalidate = useInvalidateGroups(divisionId);
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; slug?: string; order?: number };
    }) => groupsService.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteGroup(divisionId: string) {
  const invalidate = useInvalidateGroups(divisionId);
  return useMutation({
    mutationFn: (id: string) => groupsService.remove(id),
    onSuccess: invalidate,
  });
}

export function useAssignTeamsToGroups(divisionId: string) {
  const invalidate = useInvalidateGroups(divisionId);
  return useMutation({
    mutationFn: (assignments: GroupAssignment[]) =>
      groupsService.assignTeams(divisionId, assignments),
    onSuccess: invalidate,
  });
}
