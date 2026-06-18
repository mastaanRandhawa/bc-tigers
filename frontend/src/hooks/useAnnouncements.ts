import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { announcementsService } from '@/services/announcements.service';

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.all(),
    queryFn: async () => (await announcementsService.getAll()).data,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      type?: string;
      tournament_id?: string | null;
    }) => announcementsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all() });
      qc.invalidateQueries({ queryKey: queryKeys.hub.home });
    },
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
      data: {
        title?: string;
        message?: string;
        tournament_id?: string | null;
        type?: string;
      };
    }) => announcementsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all() });
      qc.invalidateQueries({ queryKey: queryKeys.hub.home });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all() });
      qc.invalidateQueries({ queryKey: queryKeys.hub.home });
    },
  });
}
