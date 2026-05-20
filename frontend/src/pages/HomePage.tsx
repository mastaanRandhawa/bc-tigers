import { useCallback, useMemo } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { tournamentSearchText } from '@/lib/search-text';
import { Link } from 'react-router-dom';
import PrefetchLink from '@/components/shared/PrefetchLink';
import PageLayout from '@/components/PageLayout';
import Footer from '@/components/Footer';
import { TournamentHubHeader } from '@/components/ui/hero';
import MatchCard from '@/components/MatchCard';
import SectionHeader from '@/components/shared/SectionHeader';
import Section from '@/components/shared/Section';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { useHomeHub } from '@/hooks/useHomeHub';
import { formatDate } from '@/lib/date';
import {
  hubMatchesPath,
  hubSchedulePath,
  pickFeaturedTournament,
  tournamentOverviewPath,
} from '@/lib/featured-tournament';
import { Calendar, ChevronRight, Trophy, Swords, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useHomeHub();

  const tournaments = data?.tournaments ?? [];
  const liveMatches = data?.liveMatches ?? [];
  const liveAndRecent = data?.recentMatches ?? [];
  const upcoming = data?.upcomingMatches ?? [];

  const featuredTournament = useMemo(
    () => pickFeaturedTournament(tournaments),
    [tournaments],
  );

  const tournamentPath = tournamentOverviewPath(featuredTournament);
  const schedulePath = hubSchedulePath(featuredTournament, upcoming);
  const matchesPath = hubMatchesPath(featuredTournament, liveMatches, liveAndRecent);

  const highlightedTournaments = useMemo(
    () => tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'ACTIVE'),
    [tournaments],
  );

  const getTournamentText = useCallback((t: (typeof tournaments)[0]) => tournamentSearchText(t), []);
  const {
    search: tournamentSearch,
    setSearch: setTournamentSearch,
    filtered: filteredTournaments,
    debouncedSearch: debouncedTournamentSearch,
    hasQuery: hasTournamentQuery,
  } = useListSearch(tournaments, getTournamentText);

  const displayTournaments = hasTournamentQuery
    ? filteredTournaments
    : filteredTournaments.slice(0, 4);

  return (
    <PageLayout heroTheme showFooter={false}>
      <TournamentHubHeader />

      <section className="w-full bg-zinc-50">
        <div className="page-container py-5 md:py-6">
          <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <Link to={schedulePath} className="feature-card items-center gap-2.5 text-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-zinc-50">
                <Calendar className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 w-full">
                <h3 className="text-subsection m-0">Schedule</h3>
                <p className="text-body-sm mt-0.5">
                  {featuredTournament ? featuredTournament.name : 'Tournament fixtures'}
                </p>
              </div>
            </Link>
            <Link to={matchesPath} className="feature-card items-center gap-2.5 text-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-zinc-50">
                <Swords className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 w-full">
                <h3 className="text-subsection m-0">Live & results</h3>
                <p className="text-body-sm mt-0.5">
                  {liveMatches.length > 0 ? `${liveMatches.length} live now` : 'Scores & fixtures'}
                </p>
              </div>
            </Link>
            <Link to={tournamentPath} className="feature-card items-center gap-2.5 text-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-zinc-50">
                <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 w-full">
                <h3 className="text-subsection m-0">Divisions</h3>
                <p className="text-body-sm mt-0.5">Browse all competition brackets</p>
              </div>
            </Link>
          </div>

          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            variant="skeleton-cards"
          >
            {highlightedTournaments.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-5">
                <Trophy className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-medium text-foreground">Tournaments</span>
                <div className="flex flex-wrap gap-1.5">
                  {highlightedTournaments.map((t) => (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.slug}`}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
                <Link
                  to="/tournaments"
                  className="ml-auto inline-flex items-center gap-0.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  All <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}

            {liveMatches.length > 0 && (
              <Section className="mb-6">
                <SectionHeader title="Live now" href={matchesPath} linkLabel="All live" />
                <div className="divide-y divide-border">
                  {liveMatches.slice(0, 3).map((match) => (
                    <MatchCard key={match.id} match={match} flat />
                  ))}
                </div>
              </Section>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Section className="lg:col-span-2">
                <SectionHeader
                  title="Recent results"
                  href={matchesPath}
                  linkLabel="All matches"
                />
                <QueryState isEmpty={liveAndRecent.length === 0} emptyMessage="No recent matches.">
                  <div className="divide-y divide-border">
                    {liveAndRecent.map((match) => (
                      <MatchCard key={match.id} match={match} flat />
                    ))}
                  </div>
                </QueryState>
              </Section>

              <Section>
                <SectionHeader title="Upcoming" href={schedulePath} linkLabel="Full schedule" />
                {upcoming.length > 0 ? (
                  <div className="divide-y divide-border">
                    {upcoming.map((match) => (
                      <MatchCard key={match.id} match={match} compact />
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-zinc-500">No upcoming matches</p>
                )}
              </Section>
            </div>

            <section>
              <SectionHeader title="Tournaments" href="/tournaments" linkLabel="View all" />
              {tournaments.length > 4 && (
                <SearchField
                  value={tournamentSearch}
                  onChange={setTournamentSearch}
                  placeholder="Search tournaments…"
                  className="mb-4 max-w-md"
                />
              )}
              <QueryState
                isEmpty={tournaments.length === 0}
                emptyMessage="No tournaments yet."
                variant="skeleton-cards"
              >
                {hasTournamentQuery && displayTournaments.length === 0 ? (
                  <SearchEmpty query={debouncedTournamentSearch} entityLabel="tournaments" />
                ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {displayTournaments.map((t) => (
                    <PrefetchLink
                      key={t.id}
                      to={`/tournaments/${t.slug}`}
                      tournamentSlug={t.slug}
                      className="group ds-card-hover overflow-hidden"
                    >
                      <div className="relative flex h-20 items-center justify-center border-b border-border bg-zinc-50">
                        <div className="rounded-xl border border-border bg-white p-2 shadow-sm">
                          <Trophy className="h-6 w-6 text-primary" aria-hidden />
                        </div>
                        <Badge
                          variant={
                            t.status === 'ACTIVE'
                              ? 'success'
                              : t.status === 'UPCOMING'
                                ? 'scheduled'
                                : 'default'
                          }
                          className="absolute right-2.5 top-2.5 rounded-md"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="p-3.5">
                        <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                          {t.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-zinc-500">{t.location}</p>
                        <p className="mt-1.5 text-xs text-zinc-400">
                          {formatDate(t.start_date)} – {formatDate(t.end_date)}
                        </p>
                      </div>
                    </PrefetchLink>
                  ))}
                </div>
                )}
              </QueryState>
            </section>
          </QueryState>
        </div>

        <Footer className="mt-10 md:mt-12" />
      </section>
    </PageLayout>
  );
}
