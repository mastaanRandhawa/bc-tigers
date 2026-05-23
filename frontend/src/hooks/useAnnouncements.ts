import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { notificationsService } from '@/services/notifications.service';

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.all(),
    queryFn: async () => (await notificationsService.getAnnouncements()).data,
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; message?: string; tournament_id?: string | null; type?: string };
    }) => notificationsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all() });
      qc.invalidateQueries({ queryKey: queryKeys.hub.home });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all() });
      qc.invalidateQueries({ queryKey: queryKeys.hub.home });
    },
  });
}
