import { Link, type LinkProps } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { queryTiming } from '@/lib/query-options';
import { tournamentsService } from '@/services/tournaments.service';

interface PrefetchLinkProps extends LinkProps {
  tournamentSlug?: string;
}

/** Prefetch tournament detail on hover/focus for faster navigation */
export default function PrefetchLink({ tournamentSlug, onMouseEnter, onFocus, ...props }: PrefetchLinkProps) {
  const qc = useQueryClient();

  const prefetch = () => {
    if (!tournamentSlug) return;
    qc.prefetchQuery({
      queryKey: queryKeys.tournaments.detail(tournamentSlug),
      queryFn: async () => (await tournamentsService.getOne(tournamentSlug)).data,
      ...queryTiming.feed,
    });
  };

  return (
    <Link
      {...props}
      onMouseEnter={(e) => {
        prefetch();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        prefetch();
        onFocus?.(e);
      }}
    />
  );
}
