import { useQuery } from '@tanstack/react-query';
import { tournamentsService } from '@/services/tournaments.service';
import { teamsService } from '@/services/teams.service';

export type HistoryEntity = 'Tournament' | 'Team';

const fetchers = {
  Tournament: (id: string) => tournamentsService.history(id),
  Team: (id: string) => teamsService.history(id),
} as const;

/** Immutable version history for a single record (admin). */
export function useRecordHistory(
  entity: HistoryEntity,
  id: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['record-history', entity, id],
    queryFn: async () => (await fetchers[entity](id!)).data,
    enabled: enabled && !!id,
  });
}
