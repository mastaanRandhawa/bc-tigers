import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { useTournamentOverview } from '@/hooks/useTournaments';
import { Trophy, Calendar, MapPin, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function TournamentDetailPage() {
  const { tournamentSlug } = useParams();
  const { data: overview, isLoading, isError, refetch } = useTournamentOverview(tournamentSlug);
  const tournament = overview?.tournament;
  const divisions = tournament?.divisions ?? [];
  const getDivisionText = useCallback(
    (d: (typeof divisions)[0]) => divisionSearchText(d),
    [],
  );
  const {
    search: divisionSearch,
    setSearch: setDivisionSearch,
    filtered: filteredDivisions,
    debouncedSearch: debouncedDivisionSearch,
    hasQuery: hasDivisionQuery,
  } = useListSearch(divisions, getDivisionText);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!tournament}
      onRetry={() => refetch()}
      emptyMessage="Tournament not found."
    >
      {tournament && (
        <>
          {/* ── Hero band ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden border-b border-border bg-hero-gradient py-7 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-brand-grid opacity-40" />
            <div className="relative z-10 page-container">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                  <Trophy className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge
                    variant={tournament.status === 'ACTIVE' ? 'success' : 'default'}
                    className="mb-2 rounded-md"
                  >
                    {tournament.status}
                  </Badge>
                  <h1 className="text-page-title m-0">{tournament.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                    </span>
                    {tournament.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {tournament.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5" aria-hidden />
                      {tournament.tournament_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────────────── */}
          <PageContent>
            {/* One unified card that groups About + Divisions */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

              {/* About */}
              {tournament.description && (
                <div className="px-5 py-5">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    About
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {tournament.description}
                  </p>
                </div>
              )}

              {/* Divider between About and Divisions */}
              {tournament.description && (
                <div className="border-t border-border/60" />
              )}

              {/* Divisions header row */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Divisions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {divisions.length} {divisions.length === 1 ? 'division' : 'divisions'} in this tournament
                  </p>
                </div>
                {divisions.length > 3 && (
                  <SearchField
                    value={divisionSearch}
                    onChange={setDivisionSearch}
                    placeholder="Search divisions…"
                    className="w-48 sm:w-64"
                    aria-label="Search divisions"
                  />
                )}
              </div>

              {/* Divisions list */}
              {hasDivisionQuery && filteredDivisions.length === 0 ? (
                <div className="border-t border-border/60 px-5 py-8">
                  <SearchEmpty query={debouncedDivisionSearch} entityLabel="divisions" />
                </div>
              ) : (
                <div className="divide-y divide-border/60 border-t border-border/60">
                  {filteredDivisions.map((div) => (
                    <DivisionDirectoryCard
                      key={div.id}
                      variant="row"
                      division={{ ...div, tournament }}
                    />
                  ))}
                </div>
              )}
            </div>
          </PageContent>
        </>
      )}
    </QueryState>
  );
}
