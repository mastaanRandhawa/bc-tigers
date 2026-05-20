import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { coachesService } from '@/services/coaches.service';

export function useCoaches() {
  return useQuery({
    queryKey: queryKeys.coaches.all,
    queryFn: async () => (await coachesService.getAll()).data,
  });
}
