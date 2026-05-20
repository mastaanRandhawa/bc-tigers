import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { queryTiming } from '@/lib/query-options';
import { hubService } from '@/services/hub.service';

export function useHomeHub() {
  return useQuery({
    queryKey: queryKeys.hub.home,
    queryFn: async () => (await hubService.getHome()).data,
    ...queryTiming.feed,
  });
}
