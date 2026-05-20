import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { announcementsService } from '@/services/announcements.service';
import type { Announcement } from '@/types';

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.all,
    queryFn: async () => (await announcementsService.getAll()).data,
  });
}

export function useAnnouncement(slug?: string) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(slug ?? ''),
    queryFn: async () => (await announcementsService.getOne(slug!)).data,
    enabled: !!slug,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Announcement>) => announcementsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements.all }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) =>
      announcementsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements.all }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements.all }),
  });
}
