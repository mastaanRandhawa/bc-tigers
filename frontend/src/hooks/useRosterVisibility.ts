import { usePublicSettings } from '@/hooks/useSettings';

export function useRosterVisibility() {
  const query = usePublicSettings();

  return {
    ...query,
    rostersPublic: query.data?.rosters_public ?? false,
    rostersAvailableAt: query.data?.rosters_available_at ?? null,
  };
}
