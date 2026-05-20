import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { settingsService } from '@/services/settings.service';
import type { SiteSettings } from '@/types';

export function usePublicSettings() {
  return useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: async () => (await settingsService.getPublic()).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.settings.admin,
    queryFn: async () => (await settingsService.getAdmin()).data,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SiteSettings>) => settingsService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.admin });
      qc.invalidateQueries({ queryKey: queryKeys.settings.public });
    },
  });
}
