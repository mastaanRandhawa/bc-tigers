import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import SectionHeader from '@/components/shared/SectionHeader';
import Section from '@/components/shared/Section';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { useTournament } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useTopScorers } from '@/hooks/useStats';
import { useStandings } from '@/hooks/useStandings';
import { Trophy, Calendar, MapPin, Flag, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getDivisionStandingsPath,
  getDivisionSchedulePath,
  divisionStatsPath,
} from '@/lib/division-routes';
import { formatDate } from '@/lib/utils';

export default function TournamentDetailPage() {
  const { tournamentSlug } = useParams();
  const { data: tournament, isLoading, isError, refetch } = useTournament(tournamentSlug);
  const { data: matches = [] } = useMatches(tournament ? { tournamentId: tournament.id } : undefined);
  const { data: topScorers = [] } = useTopScorers(
    tournament ? { tournamentId: tournament.id, limit: 5 } : undefined,
  );
  const firstDivision = tournament?.divisions?.[0];
  const { data: standings = [] } = useStandings(firstDivision?.id);

  const featured = matches.filter((m) => m.status === 'LIVE' || m.status === 'COMPLETED').slice(0, 2);
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 3);
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
  const primaryDivision = divisions[0];
  const standingsPath = primaryDivision
    ? getDivisionStandingsPath({ ...primaryDivision, tournament })
    : null;
  const schedulePath = primaryDivision
    ? getDivisionSchedulePath({ ...primaryDivision, tournament })
    : null;
  const statsPath =
    tournament && primaryDivision
      ? `${divisionStatsPath(tournament.slug, primaryDivision.slug)}/top-scorers`
      : null;

  return (
    <PageLayout>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!tournament}
        onRetry={() => refetch()}
        emptyMessage="Tournament not found."
      >
        {tournament && (
          <>
            <div className="relative overflow-hidden border-b border-border bg-hero-gradient py-6 sm:py-8">
              <div className="pointer-events-none absolute inset-0 bg-brand-grid opacity-40" />
              <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-sm">
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
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" aria-hidden />
                        {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                      </span>
                      {tournament.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" aria-hidden />
                          {tournament.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Flag className="h-4 w-4" aria-hidden />
                        {tournament.tournament_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-3 lg:gap-6 lg:px-8">
              <div className="space-y-5 lg:col-span-2">
                {tournament.description && (
                  <Section>
                    <h2 className="text-subsection mb-2">About</h2>
                    <p className="text-body m-0">{tournament.description}</p>
                  </Section>
                )}

                <section>
                  <SectionHeader title="Divisions" />
                  {divisions.length > 3 && (
                    <SearchField
                      value={divisionSearch}
                      onChange={setDivisionSearch}
                      placeholder="Search divisions…"
                      className="mb-3 max-w-md"
                    />
                  )}
                  {hasDivisionQuery && filteredDivisions.length === 0 ? (
                    <SearchEmpty query={debouncedDivisionSearch} entityLabel="divisions" />
                  ) : (
                    <div className="space-y-2">
                      {filteredDivisions.map((div) => (
                        <DivisionDirectoryCard
                          key={div.id}
                          division={{ ...div, tournament }}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <Section>
                  <SectionHeader title="Featured matches" />
                  {featured.length > 0 ? (
                    <div className="divide-y divide-border">
                      {featured.map((m) => (
                        <MatchCard key={m.id} match={m} flat />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">No featured matches yet.</p>
                  )}
                </Section>

                <Section>
                  <SectionHeader
                    title="Standings"
                    href={standingsPath ?? `/tournaments/${tournament.slug}`}
                    linkLabel="Full table"
                  />
                  <StandingsTable
                    standings={standings}
                    compact
                    division={firstDivision}
                    searchable={false}
                  />
                </Section>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl bg-white shadow-sm ring-1 ring-border/60 p-3.5">
                  <SectionHeader
                    title="Upcoming"
                    href={schedulePath ?? `/tournaments/${tournament.slug}`}
                    linkLabel="Schedule"
                  />
                  <div className="divide-y divide-border">
                    {upcoming.map((m) => (
                      <MatchCard key={m.id} match={m} compact />
                    ))}
                  </div>
                  {upcoming.length === 0 && (
                    <p className="text-sm text-zinc-500">No upcoming fixtures.</p>
                  )}
                </section>

                <Section>
                  <SectionHeader
                    title="Top scorers"
                    href={statsPath ?? `/tournaments/${tournament.slug}`}
                    linkLabel="All stats"
                  />
                  <div className="space-y-2.5">
                    {topScorers.map((stat, i) => (
                      <div key={stat.id} className="flex items-center gap-3">
                        <span className="w-5 text-center text-sm font-medium tabular-nums text-zinc-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {stat.player?.first_name} {stat.player?.last_name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">{stat.team?.name}</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-primary">{stat.goals}G</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </PageLayout>
  );
}
