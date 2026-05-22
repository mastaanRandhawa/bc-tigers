import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { tournamentSearchText } from '@/lib/search-text';
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
import { pickFeaturedTournament } from '@/lib/featured-tournament';
import { ChevronRight, Trophy, Megaphone, ImageIcon } from 'lucide-react';

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useHomeHub();

  const tournaments = data?.tournaments ?? [];
  const liveMatches = data?.liveMatches ?? [];
  const liveAndRecent = data?.recentMatches ?? [];
  const upcoming = data?.upcomingMatches ?? [];
  const announcements = data?.announcements ?? [];
  const featuredMedia = data?.featuredMedia ?? [];

  const featuredTournament = useMemo(
    () => pickFeaturedTournament(tournaments),
    [tournaments],
  );

  const highlightedTournaments = useMemo(
    () => tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'ACTIVE'),
    [tournaments],
  );

  const getTournamentText = useCallback(
    (t: (typeof tournaments)[0]) => tournamentSearchText(t),
    [],
  );
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div>
              <h2 className="text-section m-0">Competitions</h2>
              <p className="text-body-sm mt-1 text-zinc-500">
                {featuredTournament
                  ? `Featured: ${featuredTournament.name}`
                  : 'Browse active and upcoming tournaments'}
              </p>
            </div>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              All tournaments
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            variant="skeleton-cards"
          >
            {highlightedTournaments.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Trophy className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-medium text-foreground">Quick access</span>
                <div className="flex flex-wrap gap-1.5">
                  {highlightedTournaments.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.slug}`}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {liveMatches.length > 0 && (
              <Section className="mb-6">
                <SectionHeader title="Live now" linkLabel="View tournaments" href="/tournaments" />
                <div className="divide-y divide-border">
                  {liveMatches.slice(0, 3).map((match) => (
                    <MatchCard key={match.id} match={match} flat />
                  ))}
                </div>
              </Section>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Section className="lg:col-span-2">
                <SectionHeader title="Recent results" href="/tournaments" linkLabel="Tournaments" />
                <QueryState isEmpty={liveAndRecent.length === 0} emptyMessage="No recent matches.">
                  <div className="divide-y divide-border">
                    {liveAndRecent.map((match) => (
                      <MatchCard key={match.id} match={match} flat />
                    ))}
                  </div>
                </QueryState>
              </Section>

              <Section>
                <SectionHeader title="Upcoming" href="/tournaments" linkLabel="Tournaments" />
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

            {announcements.length > 0 && (
              <Section className="mb-6">
                <SectionHeader title="Announcements" />
                <ul className="space-y-2">
                  {announcements.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-border bg-white px-4 py-3"
                    >
                      <div className="flex items-start gap-2">
                        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <div>
                          <p className="font-medium text-foreground">{a.title}</p>
                          <p className="mt-0.5 text-sm text-zinc-600">{a.message}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {featuredMedia.length > 0 && (
              <Section className="mb-6">
                <SectionHeader title="Featured media" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {featuredMedia.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden rounded-lg border border-border bg-white"
                    >
                      <div className="flex aspect-video items-center justify-center bg-zinc-100">
                        {m.type === 'PHOTO' ? (
                          <img
                            src={m.url}
                            alt={m.title ?? ''}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-zinc-400" aria-hidden />
                        )}
                      </div>
                      {m.title && (
                        <p className="truncate px-2 py-1.5 text-xs font-medium text-foreground group-hover:text-primary">
                          {m.title}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            <section>
              <SectionHeader title="Featured tournaments" href="/tournaments" linkLabel="View all" />
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
