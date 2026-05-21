import SectionBlock from '@/components/design-system/SectionBlock';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import ContentSkeleton from '@/components/design-system/ContentSkeleton';
import EmptyStatePanel from '@/components/design-system/EmptyStatePanel';
import QueryState from '@/components/shared/QueryState';
import { useTournamentRoute } from '@/context/TournamentContext';
import { useTournamentMediaResource } from '@/hooks/useTournamentResources';
import type { Media } from '@/types';
import { Image } from 'lucide-react';

export default function TournamentMediaPage() {
  const { tournamentSlug } = useTournamentRoute();
  const { data: media = [], isLoading, isError, refetch } =
    useTournamentMediaResource(tournamentSlug);

  if (isLoading) {
    return <ContentSkeleton variant="card" rows={6} />;
  }

  return (
    <QueryState
      isLoading={false}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={media.length === 0}
      emptyMessage=""
    >
      {media.length === 0 ? (
        <EmptyStatePanel
          icon={Image}
          title="No media yet"
          description="Photos and videos from this tournament will appear here."
        />
      ) : (
        <SectionBlock title="Photos & videos" variant="flat">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(media as Media[]).map((item) => (
              <SurfaceCard key={item.id} variant="interactive" padding="none" className="overflow-hidden">
                {item.type === 'VIDEO' ? (
                  <video
                    src={item.url}
                    controls
                    className="aspect-video w-full object-cover bg-foreground"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.title ?? 'Tournament media'}
                    className="aspect-video w-full object-cover"
                  />
                )}
                {item.title && (
                  <p className="truncate border-t-2 border-foreground/10 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground/65 normal-case">
                    {item.title}
                  </p>
                )}
              </SurfaceCard>
            ))}
          </div>
        </SectionBlock>
      )}
    </QueryState>
  );
}
