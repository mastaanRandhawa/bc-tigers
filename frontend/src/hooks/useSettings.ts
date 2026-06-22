import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { settingsService } from '@/services/settings.service';
import type { SiteSettings } from '@/types';
import {
  scheduledCoachLockPollInterval,
  useScheduledCoachLockRefetch,
} from '@/hooks/useScheduledCoachLockWatch';

export function usePublicSettings() {
  return useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: async () => (await settingsService.getPublic()).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSettings() {
  const query = useQuery({
    queryKey: queryKeys.settings.admin,
    queryFn: async () => (await settingsService.getAdmin()).data,
    refetchInterval: (q) =>
      scheduledCoachLockPollInterval(q.state.data?.coach_lock_scheduled_pending),
  });

  useScheduledCoachLockRefetch(
    query.data?.coach_lock_scheduled_at,
    query.data?.coach_lock_scheduled_pending,
    query.refetch,
  );

  return query;
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SiteSettings>) => settingsService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.admin });
      qc.invalidateQueries({ queryKey: queryKeys.settings.public });
      qc.invalidateQueries({ queryKey: ['coach', 'team'] });
      qc.invalidateQueries({ queryKey: ['coach', 'me'] });
    },
  });
}
