import { formatDate } from '@/lib/utils';
import SectionBlock from '@/components/design-system/SectionBlock';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import EmptyStatePanel from '@/components/design-system/EmptyStatePanel';
import QueryState from '@/components/shared/QueryState';
import { useTournamentRoute } from '@/context/TournamentContext';
import { useTournamentAnnouncements } from '@/hooks/useTournamentResources';
import { Newspaper } from 'lucide-react';

export default function TournamentNewsPage() {
  const { tournamentSlug } = useTournamentRoute();
  const { data: announcements = [], isLoading, isError, refetch } =
    useTournamentAnnouncements(tournamentSlug, 20);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={announcements.length === 0}
      emptyMessage=""
    >
      {announcements.length === 0 ? (
        <EmptyStatePanel
          icon={Newspaper}
          title="No announcements"
          description="News and updates for this tournament will be posted here."
        />
      ) : (
        <SectionBlock title="News & announcements" variant="flat">
          <div className="space-y-3">
            {announcements.map((item) => (
              <SurfaceCard key={item.id} variant="default" padding="md">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-sm font-black uppercase tracking-tight text-foreground">{item.title}</h3>
                  <span className="border-2 border-foreground bg-bauhaus-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/65">
                    {item.type}
                  </span>
                </div>
                <p className="text-body m-0">{item.message}</p>
                <time className="text-caption mt-2 block">{formatDate(item.created_at)}</time>
              </SurfaceCard>
            ))}
          </div>
        </SectionBlock>
      )}
    </QueryState>
  );
}
