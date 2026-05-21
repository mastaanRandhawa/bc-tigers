import { useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import StatusBadge from '@/components/design-system/StatusBadge';
import MetaChip from '@/components/design-system/MetaChip';
import { Link } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useListSearch } from '@/hooks/useListSearch';
import { tournamentSearchText } from '@/lib/search-text';
import { Trophy, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/date';

export default function TournamentsPage() {
  const { data: tournaments = [], isLoading, isError, refetch } = useTournaments();
  const getText = useCallback((t: (typeof tournaments)[0]) => tournamentSearchText(t), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    tournaments,
    getText,
  );

  return (
    <PageLayout>
      <PageHeader title="Tournaments" subtitle="All BC Tigers soccer competitions" icon={Trophy} />

      <PageContent>
        {!isLoading && tournaments.length > 0 && (
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search tournaments by name, location…"
            className="mb-4"
          />
        )}

        <QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && tournaments.length === 0}
          onRetry={() => refetch()}
          emptyMessage="No tournaments available yet."
        >
          {hasQuery && filtered.length === 0 ? (
            <SearchEmpty query={debouncedSearch} entityLabel="tournaments" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.slug}`}
                  className="group ds-surface-interactive flex h-full flex-col overflow-hidden"
                >
                  <div className="relative flex h-24 items-center justify-center border-b-2 border-foreground bg-gradient-to-br from-primary via-primary/80 to-foreground">
                    <div className="pointer-events-none absolute inset-0 bg-brand-grid opacity-40" aria-hidden />
                    {t.logo ? (
                      <img src={t.logo} alt="" className="relative h-14 w-14 border-2 border-white object-cover" />
                    ) : (
                      <div className="relative border-2 border-white bg-white/10 p-2.5 transition-transform group-hover:scale-105">
                        <Trophy className="h-7 w-7 text-white" aria-hidden />
                      </div>
                    )}
                    <div className="absolute left-2.5 top-2.5">
                      <StatusBadge status={t.status} />
                    </div>
                    <span className="absolute right-2.5 top-2.5 border-2 border-foreground bg-bauhaus-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground">
                      {t.tournament_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="text-base font-black uppercase tracking-tight leading-tight text-foreground transition-colors group-hover:text-primary">
                      {t.name}
                    </h2>
                    {t.description && (
                      <p className="mt-2 line-clamp-2 flex-1 text-sm font-medium text-foreground/70 normal-case">
                        {t.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <MetaChip
                        icon={Calendar}
                        value={`${formatDate(t.start_date)} – ${formatDate(t.end_date)}`}
                      />
                      {t.location && <MetaChip icon={MapPin} value={t.location} />}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t-2 border-foreground/10 pt-3">
                      <span className="text-xs font-black uppercase tracking-widest text-foreground/45">View tournament</span>
                      <ChevronRight
                        className="h-4 w-4 text-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </QueryState>
      </PageContent>
    </PageLayout>
  );
}
