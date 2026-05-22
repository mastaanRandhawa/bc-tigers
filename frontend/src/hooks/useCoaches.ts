import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { coachesService } from '@/services/coaches.service';
import type { Coach } from '@/types';

export function useCoaches() {
  return useQuery({
    queryKey: queryKeys.coaches.all,
    queryFn: async () => (await coachesService.getAll()).data,
  });
}

export function useCreateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Coach>) => coachesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coaches.all }),
  });
}

export function useUpdateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coach> }) =>
      coachesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coaches.all }),
  });
}

export function useDeleteCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coachesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coaches.all }),
  });
}

export function useAssignCoachToTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      coach_id,
      role,
    }: {
      teamId: string;
      coach_id: string;
      role?: string;
    }) => coachesService.assignToTeam(teamId, { coach_id, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.coaches.all });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
