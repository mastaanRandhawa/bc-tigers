import { useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { Link } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useListSearch } from '@/hooks/useListSearch';
import { tournamentSearchText } from '@/lib/search-text';
import { Trophy, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
            className="mb-5"
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.slug}`}
                  className="group ds-card-hover h-full overflow-hidden"
                >
                  <div className="relative flex h-24 items-center justify-center border-b border-border bg-zinc-50">
                    <div className="rounded-xl border border-border bg-white p-2.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                      <Trophy className="h-7 w-7 text-primary" aria-hidden />
                    </div>
                    <Badge
                      variant={
                        t.status === 'ACTIVE'
                          ? 'success'
                          : t.status === 'UPCOMING'
                            ? 'scheduled'
                            : 'default'
                      }
                      className="absolute left-2.5 top-2.5 rounded-md"
                    >
                      {t.status === 'ACTIVE' ? 'Active' : t.status}
                    </Badge>
                    <span className="absolute right-2.5 top-2.5 rounded-md border border-border bg-white/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {t.tournament_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-3.5">
                    <h2 className="text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                      {t.name}
                    </h2>
                    {t.description && (
                      <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-zinc-500">
                        {t.description}
                      </p>
                    )}

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                        <span>
                          {formatDate(t.start_date)} – {formatDate(t.end_date)}
                        </span>
                      </div>
                      {t.location && (
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                          <span>{t.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs font-medium text-zinc-500">
                        View divisions & schedule
                      </span>
                      <ChevronRight
                        className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
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
