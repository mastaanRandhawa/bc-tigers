import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      user_id?: string;
      tournament_id?: string;
      title: string;
      message: string;
      type?: string;
    }) => notificationsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['hub'] });
    },
  });
}
