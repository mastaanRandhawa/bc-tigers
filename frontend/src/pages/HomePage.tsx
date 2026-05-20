import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import Footer from '@/components/Footer';
import { TournamentHubHeader } from '@/components/ui/hero';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import SectionHeader from '@/components/shared/SectionHeader';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';
import { Calendar, ChevronRight, Trophy, Swords, TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  getDivisionStandingsPath,
  getDivisionSchedulePath,
  getDivisionMatchesPath,
} from '@/lib/division-routes';
import type { Division } from '@/types';

function DivisionStandingsSnippet({ division }: { division: Division }) {
  const { data: standings = [] } = useStandings(division.id);
  const path = getDivisionStandingsPath(division);

  return (
    <div className="home-section">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-subsection m-0">{division.name}</h3>
        {path && (
          <Link to={path} className="text-sm font-medium text-primary hover:text-primary-hover">
            Full table
          </Link>
        )}
      </div>
      <StandingsTable standings={standings} compact division={division} />
    </div>
  );
}

export default function HomePage() {
  const { data: tournaments = [] } = useTournaments();
  const { data: divisions = [] } = useDivisions();
  const { data: allMatches = [] } = useMatches();

  const activeTournaments = tournaments.filter((t) => t.status === 'ACTIVE');
  const featuredDivision = divisions[0];
  const schedulePath = featuredDivision ? getDivisionSchedulePath(featuredDivision) : '/tournaments';
  const matchesPath = featuredDivision ? getDivisionMatchesPath(featuredDivision) : '/tournaments';
  const standingsPath = featuredDivision ? getDivisionStandingsPath(featuredDivision) : '/tournaments';

  const liveMatches = allMatches.filter((m) => m.status === 'LIVE');
  const liveAndRecent = allMatches
    .filter((m) => m.status === 'LIVE' || m.status === 'COMPLETED')
    .slice(0, 4);
  const upcoming = allMatches.filter((m) => m.status === 'SCHEDULED').slice(0, 4);

  return (
    <PageLayout heroTheme showFooter={false}>
      <TournamentHubHeader />

      <section className="sheet-top px-4 py-6 md:px-8 md:py-8 mt-auto w-full">
        <div className="max-w-6xl mx-auto">
          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <Link
              to={schedulePath ?? '/tournaments'}
              className="feature-card flex-row sm:flex-col items-start sm:items-stretch gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-subsection m-0">Schedule</h3>
                <p className="text-body-sm mt-1">Matches, venues & kickoffs</p>
              </div>
            </Link>
            <Link
              to={matchesPath ?? '/tournaments'}
              className="feature-card flex-row sm:flex-col items-start sm:items-stretch gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-subsection m-0">Live & results</h3>
                <p className="text-body-sm mt-1">
                  {liveMatches.length > 0 ? `${liveMatches.length} live now` : 'Scores & fixtures'}
                </p>
              </div>
            </Link>
            <Link
              to={standingsPath ?? '/tournaments'}
              className="feature-card flex-row sm:flex-col items-start sm:items-stretch gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-subsection m-0">Standings</h3>
                <p className="text-body-sm mt-1">Points, wins & goal diff</p>
              </div>
            </Link>
          </div>

          {activeTournaments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b border-border">
              <Trophy className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">Active tournaments</span>
              <div className="flex gap-2 flex-wrap">
                {activeTournaments.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.slug}`}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-border bg-white hover:border-primary/30 hover:text-primary transition-colors text-foreground"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/tournaments"
                className="text-sm font-medium text-primary hover:text-primary-hover ml-auto inline-flex items-center gap-1"
              >
                All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Live matches strip */}
          {liveMatches.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="Live now" />
              <div className="space-y-2">
                {liveMatches.slice(0, 3).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <section className="lg:col-span-2 home-section">
              <SectionHeader
                title="Recent results"
                href={matchesPath ?? '/tournaments'}
                linkLabel="All matches"
              />
              <QueryState isEmpty={liveAndRecent.length === 0} emptyMessage="No recent matches.">
                <div className="space-y-2">
                  {liveAndRecent.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </QueryState>
            </section>

            <section className="home-section">
              <SectionHeader
                title="Upcoming"
                href={schedulePath ?? '/tournaments'}
                linkLabel="Schedule"
              />
              {upcoming.length > 0 ? (
                <div className="divide-y divide-border -mx-1">
                  {upcoming.map((match) => (
                    <div key={match.id} className="px-1 py-1">
                      <MatchCard match={match} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 py-4 text-center">No upcoming matches</p>
              )}
            </section>
          </div>

          {divisions.length > 0 && (
            <section className="mb-8">
              <SectionHeader
                title="League standings"
                subtitle="By division"
                href="/tournaments"
                linkLabel="All tournaments"
              />
              <div className="space-y-4">
                {divisions.map((division) => (
                  <DivisionStandingsSnippet key={division.id} division={division} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeader
              title="Tournaments"
              href="/tournaments"
              linkLabel="View all"
            />
            <QueryState
              isEmpty={tournaments.length === 0}
              emptyMessage="No tournaments yet."
              variant="skeleton-cards"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tournaments.slice(0, 4).map((t) => (
                  <Link key={t.id} to={`/tournaments/${t.slug}`} className="group ds-card-hover overflow-hidden">
                    <div className="h-24 bg-zinc-50 relative flex items-center justify-center border-b border-border">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm border border-border">
                        <Trophy className="w-7 h-7 text-primary" />
                      </div>
                      <Badge
                        variant={t.status === 'ACTIVE' ? 'success' : 'default'}
                        className="absolute top-2.5 right-2.5"
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-0.5">{t.location}</p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {formatDate(t.start_date)} – {formatDate(t.end_date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </QueryState>
          </section>
        </div>

        <Footer />
      </section>
    </PageLayout>
  );
}
